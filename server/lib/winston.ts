import { createLogger, transports, format } from 'winston';

// 创建 logger 实例，并配置 transports
const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp(), // 添加时间戳
		format.simple(),
	),
	transports: [new transports.Console({})],
});

export default logger;
