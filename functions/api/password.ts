export const onRequest = async (context: any) => {
  const { request, env } = context;
  
  if (request.method.toUpperCase() !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method Not Allowed' 
    }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const { password } = body;
    
    // 从环境变量获取管理员密码
    const adminPassword = env.PASSWORD;
    
    if (!adminPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '管理员密码未配置' 
      }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    if (!password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '密码不能为空' 
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    // 验证密码 - 使用时间安全的字符串比较
    const isValid = password.length === adminPassword.length && 
                   password === adminPassword;
    
    return new Response(JSON.stringify({ 
      success: isValid,
      message: isValid ? '密码验证成功' : '密码错误'
    }), {
      headers: { 'content-type': 'application/json' }
    });
    
  } catch (error) {
    console.error('密码验证错误:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '密码验证失败' 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}; 
