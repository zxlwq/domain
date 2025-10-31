import { neon } from '@neondatabase/serverless';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}

function getDaysUntilExpiry(expire_date) {
  const today = new Date();
  const expiry = new Date(expire_date);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function isExpiringSoon(expire_date, days = 15) {
  const daysLeft = getDaysUntilExpiry(expire_date);
  return daysLeft <= days && daysLeft > 0;
}

async function logNotificationDetail(sql, action, details, status = 'info', domain, method, error) {
  try {
    await sql`INSERT INTO logs (type, action, details, status, domain, notification_method, error_details)
              VALUES ('notification', ${action}, ${details}, ${status}, ${domain || 'system'}, ${method || 'system'}, ${error || null})`;
  } catch {}
}

async function sendWeChatNotify(title, content, sendKey) {
  const res = await fetch(`https://sctapi.ftqq.com/${sendKey}.send`, {
    method: 'POST', body: new URLSearchParams({ title, desp: content }) });
  return res.json();
}

async function sendQQNotify(content, key, qq) {
  const res = await fetch(`https://qmsg.zendee.cn/send/${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ msg: content, qq }) });
  return res.json();
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }
  let sql;
  try { sql = neon(env.DATABASE_URL); } catch (e) { return json({ success: false, error: e.message }, 500); }
  const method = request.method.toUpperCase();

  if (method === 'GET') {
    try {
      const rows = await sql`SELECT warning_days as "warningDays", notification_enabled as "notificationEnabled", notification_interval as "notificationInterval", notification_method as "notificationMethod", bg_image_url as "bgImageUrl", carousel_interval as "carouselInterval", carousel_enabled as "carouselEnabled" FROM notification_settings LIMIT 1`;
      if (!rows.length) {
        return json({ success: true, settings: { warningDays: '15', notificationEnabled: 'true', notificationInterval: 'daily', notificationMethod: [], bgImageUrl: '', carouselInterval: 30, carouselEnabled: 'true' }});
      }
      const row = rows[0] || {};
      let methodsRaw = row.notificationMethod;
      let methodsParsed = [];
      if (Array.isArray(methodsRaw)) { methodsParsed = methodsRaw; }
      else if (typeof methodsRaw === 'string') { try { methodsParsed = JSON.parse(methodsRaw); } catch { methodsParsed = []; } }
      const settings = {
        warningDays: String(row.warningDays ?? '15'),
        notificationEnabled: String(row.notificationEnabled ?? 'true'),
        notificationInterval: String(row.notificationInterval ?? 'daily'),
        notificationMethod: methodsParsed,
        notificationMethods: methodsParsed,
        bgImageUrl: row.bgImageUrl ?? '',
        carouselInterval: row.carouselInterval ?? 30,
        carouselEnabled: String(row.carouselEnabled ?? 'true')
      };
      return json({ success: true, settings });
    } catch (e) { return json({ success: false, error: String(e.message || e) }, 500); }
  }

  if (method === 'POST') {
    try {
      const rawBody = await request.text();
      const body = rawBody ? JSON.parse(rawBody) : {};
      if (body && body.settings) {
        const incoming = body.settings;
        const s = {
          warningDays: (incoming?.warningDays ?? '15').toString(),
          notificationEnabled: (incoming?.notificationEnabled ?? 'true').toString(),
          notificationInterval: (incoming?.notificationInterval ?? 'daily').toString(),
          notificationMethod: incoming?.notificationMethod ?? incoming?.notificationMethods ?? []
        };
        await sql`DELETE FROM notification_settings`;
        let methodsValue = s.notificationMethod;
        if (typeof methodsValue === 'string') {
          try { const arr = JSON.parse(methodsValue); methodsValue = Array.isArray(arr) ? JSON.stringify(arr) : JSON.stringify([]); } catch { methodsValue = JSON.stringify([]); }
        } else if (Array.isArray(methodsValue)) { methodsValue = JSON.stringify(methodsValue); } else { methodsValue = JSON.stringify([]); }
        await sql`INSERT INTO notification_settings (warning_days, notification_enabled, notification_interval, notification_method, bg_image_url, carousel_interval, carousel_enabled)
                  VALUES (${s.warningDays}, ${s.notificationEnabled}, ${s.notificationInterval}, ${methodsValue}, ${incoming?.bgImageUrl ?? ''}, ${parseInt(incoming?.carouselInterval ?? '30', 10) || 30}, ${String(incoming?.carouselEnabled ?? 'true')})`;
        await logNotificationDetail(sql, 'SAVE_SETTINGS', '通知设置保存成功', 'success');
        return json({ success: true, message: '设置已保存' });
      }

      if (body.domains) {
        let notifyMethods = [];
        const envMethods = [];
        const getEnv = (k) => (env && env[k]) || (typeof process !== 'undefined' && process.env ? process.env[k] : undefined);
        if (getEnv('TG_BOT_TOKEN') && getEnv('TG_USER_ID')) envMethods.push('telegram');
        if (getEnv('WECHAT_SENDKEY')) envMethods.push('wechat');
        if (getEnv('QMSG_KEY') && getEnv('QMSG_QQ')) envMethods.push('qq');
        if (envMethods.length > 0) notifyMethods = envMethods;
        else {
          try {
            const m = await sql`SELECT notification_method FROM notification_settings LIMIT 1`;
            if (m.length > 0) {
              const val = m[0].notification_method;
              if (Array.isArray(val)) notifyMethods = val; else if (typeof val === 'string') { try { notifyMethods = JSON.parse(val); } catch { notifyMethods = ['telegram']; } }
            }
          } catch { notifyMethods = ['telegram']; }
        }
        if (!Array.isArray(notifyMethods) || notifyMethods.length === 0) notifyMethods = ['telegram'];
        let warningDays = 15;
        try {
          const r = await sql`SELECT warning_days FROM notification_settings LIMIT 1`;
          if (r.length > 0 && r[0].warning_days) warningDays = parseInt(r[0].warning_days, 10) || 15;
        } catch {}
        const expiringDomains = body.domains.filter((domain) => isExpiringSoon(domain.expire_date, warningDays));
        if (expiringDomains.length === 0) {
          return json({ success: true, message: '没有即将到期的域名' });
        }
        const results = [], errors = [];
        for (const method of notifyMethods) {
          try {
            if (method === 'telegram') {
              const botToken = getEnv('TG_BOT_TOKEN');
              const chatId = getEnv('TG_USER_ID');
              if (!botToken || !chatId) throw new Error('Telegram配置未设置');
              let message = '⚠️ <b>域名到期提醒</b>\n\n';
              message += `以下域名将在${warningDays}天内到期：\n\n`;
              expiringDomains.forEach((domain) => {
                const daysLeft = getDaysUntilExpiry(domain.expire_date);
                message += ` <b>${domain.domain}</b>\n`;
                message += `   注册商：${domain.registrar}\n`;
                message += `   到期时间：${domain.expire_date}\n`;
                message += `   剩余天数：${daysLeft}天\n\n`;
              });
              message += `请及时续费以避免域名过期！`;
              const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
              });
              if (!resp.ok) { const errorText = await resp.text(); throw new Error(`Telegram API请求失败: ${resp.status} ${resp.statusText} - ${errorText}`); }
              results.push({ method: 'telegram', ok: true });
            } else if (method === 'wechat') {
              const sendKey = getEnv('WECHAT_SENDKEY');
              if (!sendKey) throw new Error('未配置微信SendKey');
              let content = `以下域名将在${warningDays}天内到期：\n\n`;
              expiringDomains.forEach((domain) => {
                const daysLeft = getDaysUntilExpiry(domain.expire_date);
                content += `域名: ${domain.domain}\n注册商: ${domain.registrar}\n到期时间: ${domain.expire_date}\n剩余天数: ${daysLeft}天\n\n`;
              });
              content += '请及时续费以避免域名过期！';
              await sendWeChatNotify('域名到期提醒', content, sendKey);
              results.push({ method: 'wechat', ok: true });
            } else if (method === 'qq') {
              const key = getEnv('QMSG_KEY');
              const qq = getEnv('QMSG_QQ');
              if (!key || !qq) throw new Error('未配置Qmsg酱 key 或 QQ号');
              let content = `以下域名将在${warningDays}天内到期：\n\n`;
              expiringDomains.forEach((domain) => {
                const daysLeft = getDaysUntilExpiry(domain.expire_date);
                content += `域名: ${domain.domain}\n注册商: ${domain.registrar}\n到期时间: ${domain.expire_date}\n剩余天数: ${daysLeft}天\n\n`;
              });
              content += '请及时续费以避免域名过期！';
              await sendQQNotify(content, key, qq);
              results.push({ method: 'qq', ok: true });
            } else { errors.push({ method, error: '不支持的通知方式' }); }
          } catch (err) {
            errors.push({ method, error: (err?.message || err) });
          }
        }
        return json({ success: errors.length === 0, results, errors });
      }

      return json({ success: false, error: '参数错误' }, 400);
    } catch (e) { return json({ success: false, error: String(e.message || e) }, 500); }
  }

  return json({ success: false, error: '不支持的请求方法' }, 405);
}


