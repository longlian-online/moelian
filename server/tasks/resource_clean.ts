import {deleteExpiredResource} from "~/server/service/resource";
import logger from "~/server/lib/winston";

export default defineTask({
    meta: {
        name: "resource_clean",
        description: "清除无用资源",
    },
    run() {
        logger.info("正在运行资源清理任务...");
        deleteExpiredResource().then(()=>{
            logger.info("资源清理任务完成...");
        }).catch(err => {
            logger.error("资源清理任务失败...", err);
        })
        return { result: "调用成功" };
    },
});