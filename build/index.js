"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
/* ---------- 域名白名单（含 Bucket 域名） ---------- */
block_basekit_server_api_1.basekit.addDomainList([
    'dashscope.aliyuncs.com',
    'dashscope-result-bj.oss-cn-beijing.aliyuncs.com',
    'oss-cn-beijing.aliyuncs.com',
    'jtcoze.oss-cn-beijing.aliyuncs.com', // 你的 Bucket
    'feishu.cn',
    'internal-api-drive-stream.feishu.cn',
]);
block_basekit_server_api_1.basekit.addField({
    // 1. 配置授权（用户使用官方授权流程）
    authorizations: [
        {
            id: 'dashscope_auth',
            platform: 'dashscope',
            type: block_basekit_server_api_1.AuthorizationType.HeaderBearerToken,
            label: '阿里百炼 API-KEY',
            required: true,
            instructionsUrl: 'https://help.aliyun.com/document_detail/611472.html',
            icon: {
                light: 'https://img.alicdn.com/imgextra/i2/O1CN01sdqPwt1t0hBlKFj9c_!!6000000005848-2-tps-200-200.png',
                dark: 'https://img.alicdn.com/imgextra/i2/O1CN01sdqPwt1t0hBlKFj9c_!!6000000005848-2-tps-200-200.png',
            },
        },
    ],
    formItems: [
        // 2. 音视频来源：附件 / 链接 / 文本 三格式
        {
            key: 'audioVideo',
            label: '音视频来源',
            component: block_basekit_server_api_1.FieldComponent.FieldSelect,
            props: { supportType: [block_basekit_server_api_1.FieldType.Attachment, block_basekit_server_api_1.FieldType.Url, block_basekit_server_api_1.FieldType.Text], mode: 'single' },
            validator: { required: true },
        },
    ],
    resultType: { type: block_basekit_server_api_1.FieldType.Text },
    execute: async (formItemParams, context) => {
        try {
            const item = formItemParams.audioVideo?.[0];
            if (!item)
                throw new Error('未选择音视频');
            let videoUrl;
            if (item.tmp_url) {
                videoUrl = item.tmp_url;
            }
            else if (item.link) {
                videoUrl = item.link;
            }
            else if (item.text) {
                videoUrl = item.text;
            }
            else {
                throw new Error('无法识别的音视频格式');
            }
            console.log('① 视频来源', videoUrl);
            const body = {
                model: 'qwen3-asr-flash-filetrans',
                input: { file_url: videoUrl },
                parameters: { enable_itn: true },
            };
            const submitRes = await context.fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable',
                },
                body: JSON.stringify(body),
            }, 'dashscope_auth' // 使用授权ID，框架会自动添加 Authorization: Bearer API-KEY
            );
            if (!submitRes.ok)
                throw new Error(`提交任务 ${submitRes.status}`);
            const { output } = await submitRes.json();
            const taskId = output.task_id;
            console.log('② task_id', taskId);
            for (let i = 0; i < 180; i++) {
                await new Promise(r => setTimeout(r, 5000));
                const pollRes = await context.fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
                    method: 'GET',
                }, 'dashscope_auth' // 使用相同的授权ID，框架会自动添加 Authorization: Bearer API-KEY
                );
                const json = await pollRes.json();
                const status = json.output?.task_status;
                console.log('③ 轮询', i, status);
                if (status === 'SUCCEEDED') {
                    const resultUrl = json.output.result.transcription_url;
                    const resultRes = await context.fetch(resultUrl);
                    const resultJson = await resultRes.json();
                    const fullText = resultJson.transcripts?.map((t) => t.text).join('\n') || '';
                    return { code: block_basekit_server_api_1.FieldCode.Success, data: fullText };
                }
                if (status === 'FAILED')
                    throw new Error('百炼识别失败');
            }
            throw new Error('识别超时（15min）');
        }
        catch (e) {
            console.error('===真实错误===', e.message);
            return { code: block_basekit_server_api_1.FieldCode.Error, msg: e.message };
        }
    },
});
exports.default = block_basekit_server_api_1.basekit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxlQUFlO0FBQ2YsbUZBTThDO0FBRTlDLDhDQUE4QztBQUM5QyxrQ0FBTyxDQUFDLGFBQWEsQ0FBQztJQUNwQix3QkFBd0I7SUFDeEIsaURBQWlEO0lBQ2pELDZCQUE2QjtJQUM3QixvQ0FBb0MsRUFBRSxZQUFZO0lBQ2xELFdBQVc7SUFDWCxxQ0FBcUM7Q0FDdEMsQ0FBQyxDQUFDO0FBRUgsa0NBQU8sQ0FBQyxRQUFRLENBQUM7SUFDZixzQkFBc0I7SUFDdEIsY0FBYyxFQUFFO1FBQ2Q7WUFDRSxFQUFFLEVBQUUsZ0JBQWdCO1lBQ3BCLFFBQVEsRUFBRSxXQUFXO1lBQ3JCLElBQUksRUFBRSw0Q0FBaUIsQ0FBQyxpQkFBaUI7WUFDekMsS0FBSyxFQUFFLGNBQWM7WUFDckIsUUFBUSxFQUFFLElBQUk7WUFDZCxlQUFlLEVBQUUscURBQXFEO1lBQ3RFLElBQUksRUFBRTtnQkFDSixLQUFLLEVBQUUsOEZBQThGO2dCQUNyRyxJQUFJLEVBQUUsOEZBQThGO2FBQ3JHO1NBQ0Y7S0FDRjtJQUVELFNBQVMsRUFBRTtRQUNULDRCQUE0QjtRQUM1QjtZQUNFLEdBQUcsRUFBRSxZQUFZO1lBQ2pCLEtBQUssRUFBRSxPQUFPO1lBQ2QsU0FBUyxFQUFFLHlDQUFjLENBQUMsV0FBVztZQUNyQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxvQ0FBUyxDQUFDLFVBQVUsRUFBRSxvQ0FBUyxDQUFDLEdBQUcsRUFBRSxvQ0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDN0YsU0FBUyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtTQUM5QjtLQUNGO0lBQ0QsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLG9DQUFTLENBQUMsSUFBSSxFQUFFO0lBRXBDLE9BQU8sRUFBRSxL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