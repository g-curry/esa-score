// ESA边缘函数入口文件（模拟数据版）
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

        // 核心修改：生成模拟性能数据（不再发起真实请求）
        const performanceData = generateMockPerformanceData(region);

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

// 生成模拟性能数据（按地区差异化，更贴近真实）
function generateMockPerformanceData(region) {
    // 不同地区的基础性能参数（一线城市节点更快）
    const regionBaseConfig = {
        beijing: { fcp: 1500, resource: 300 * 1024, tti: 2500, dns: 200, tcp: 300 },
        shanghai: { fcp: 1200, resource: 280 * 1024, tti: 2200, dns: 180, tcp: 280 },
        guangzhou: { fcp: 1400, resource: 320 * 1024, tti: 2400, dns: 220, tcp: 310 },
        shenzhen: { fcp: 1300, resource: 290 * 1024, tti: 2300, dns: 190, tcp: 290 },
        hangzhou: { fcp: 1100, resource: 270 * 1024, tti: 2100, dns: 170, tcp: 270 }
    };

    const base = regionBaseConfig[region] || regionBaseConfig.beijing;
    // 增加随机波动，模拟真实差异
    const randomFactor = 0.2; // 20%的随机波动
    return {
        region,
        firstContentfulPaint: Math.floor(base.fcp * (1 + (Math.random() - 0.5) * randomFactor)), // 首屏加载
        resourceSize: Math.floor(base.resource * (1 + (Math.random() - 0.5) * randomFactor)), // 资源大小
        tti: Math.floor(base.tti * (1 + (Math.random() - 0.5) * randomFactor)), // 交互时间
        dnsTime: Math.floor(base.dns * (1 + (Math.random() - 0.5) * randomFactor)), // DNS解析
        tcpTime: Math.floor(base.tcp * (1 + (Math.random() - 0.5) * randomFactor)), // TCP连接
        testTime: new Date().toLocaleString() // 测试时间
    };
}