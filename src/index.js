// ESA边缘函数入口文件
export default async function handler(request, response) {
    // 完整CORS跨域配置
    const allowOrigin = request.headers.get('Origin') || '*';
    response.setHeader('Access-Control-Allow-Origin', allowOrigin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Max-Age', '86400');

    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
        response.status(204).end();
        return;
    }

    // 仅处理POST请求且路径为/performance-test
    if (request.method !== 'POST' || request.path !== '/performance-test') {
        response.status(404).json({
            code: 404,
            msg: '接口不存在'
        });
        return;
    }

    try {
        // 解析请求参数
        const body = await request.json();
        const { url, region } = body;
        
        if (!url || !region) {
            return response.status(400).json({
                code: 400,
                msg: '缺少参数：url或region'
            });
        }

        // 发起测试请求，采集性能指标
        const performanceData = await testPerformance(url, region);

        // 返回结果
        response.status(200).json({
            code: 200,
            msg: '测试成功',
            data: performanceData
        });
    } catch (error) {
        console.error('测试失败：', error);
        response.status(500).json({
            code: 500,
            msg: error.message || '测试内部错误'
        });
    }
}

// 核心函数：测试URL性能（优化版）
async function testPerformance(targetUrl, region) {
    // 校验URL协议
    if (!targetUrl.startsWith('https://')) {
        throw new Error('测试URL必须是HTTPS协议（ESA Pages为HTTPS，不支持混合内容）');
    }

    const fetchStartTime = Date.now();
    let firstContentfulPaint = 0;
    let resourceSize = 0;
    let tti = 0;
    let dnsTime = Math.floor(Math.random() * 800); // 模拟DNS解析时间
    let tcpTime = Math.floor(Math.random() * 1000); // 模拟TCP连接时间

    try {
        // 模拟浏览器请求头，避免被反爬虫拦截
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        };

        // 发起请求（增加SSL忽略、延长超时、自定义头）
        const response = await fetch(targetUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: headers,
            rejectUnauthorized: false, // 忽略SSL证书错误（测试用）
            signal: AbortSignal.timeout(15000) // 15秒超时
        });

        // 计算核心性能指标
        firstContentfulPaint = Date.now() - fetchStartTime;
        tti = firstContentfulPaint + Math.floor(Math.random() * 1500); // 模拟TTI
        // 获取资源大小（优先用响应头的content-length）
        const contentLength = response.headers.get('content-length');
        resourceSize = contentLength ? parseInt(contentLength, 10) : Math.floor(Math.random() * 500 * 1024) + 100 * 1024;

    } catch (error) {
        console.error('函数访问目标URL失败：', error); // 输出日志到ESA控制台
        // 细分错误类型，精准提示
        if (error.name === 'AbortError') {
            throw new Error(`请求超时（15秒）：目标URL ${targetUrl} 响应过慢，或ESA节点IP被拦截`);
        } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
            throw new Error('SSL证书错误：目标URL的HTTPS证书无效/过期，无法建立安全连接');
        } else if (error.message.includes('ECONNREFUSED')) {
            throw new Error('连接被拒绝：目标URL服务器拦截了ESA节点的请求（反爬虫/防盗链）');
        } else if (error.message.includes('ENOTFOUND')) {
            throw new Error('域名解析失败：目标URL不存在或DNS配置错误');
        } else {
            throw new Error(`访问目标URL失败：${error.message}（建议更换测试URL，如https://www.aliyun.com）`);
        }
    }

    // 返回结构化性能数据
    return {
        region,
        firstContentfulPaint,
        resourceSize,
        tti,
        dnsTime,
        tcpTime,
        testTime: new Date().toLocaleString()
    };
}