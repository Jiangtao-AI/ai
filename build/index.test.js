"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 测试版本 - 不使用授权，直接硬编码API-KEY
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
block_basekit_server_api_1.basekit.addDomainList([
    'dashscope.aliyuncs.com',
    'dashscope-result-bj.oss-cn-beijing.aliyuncs.com',
    'oss-cn-beijing.aliyuncs.com',
    'jtcoze.oss-cn-beijing.aliyuncs.com',
    'feishu.cn',
    'internal-api-drive-stream.feishu.cn',
]);
block_basekit_server_api_1.basekit.addField({
    // 不使用授权配置，直接在代码中写API-KEY
    formItems: [
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
            const API_KEY = 'sk-fa533d37832e4155a60d138af3f652ac'; // 直接硬编码API-KEY
            const body = {
                model: 'qwen3-asr-flash-filetrans',
                input: { file_url: videoUrl },
                parameters: { enable_itn: true },
            };
            const submitRes = await context.fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable',
                },
                body: JSON.stringify(body),
            });
            if (!submitRes.ok)
                throw new Error(`提交任务 ${submitRes.status}`);
            const { output } = await submitRes.json();
            const taskId = output.task_id;
            console.log('② task_id', taskId);
            for (let i = 0; i < 180; i++) {
                await new Promise(r => setTimeout(r, 5000));
                const pollRes = await context.fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pbmRleC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLG1GQUs4QztBQUU5QyxrQ0FBTyxDQUFDLGFBQWEsQ0FBQztJQUNwQix3QkFBd0I7SUFDeEIsaURBQWlEO0lBQ2pELDZCQUE2QjtJQUM3QixvQ0FBb0M7SUFDcEMsV0FBVztJQUNYLHFDQUFxQztDQUN0QyxDQUFDLENBQUM7QUFFSCxrQ0FBTyxDQUFDLFFBQVEsQ0FBQztJQUNmLHlCQUF5QjtJQUN6QixTQUFTLEVBQUU7UUFDVDtZQUNFLEdBQUcsRUFBRSxZQUFZO1lBQ2pCLEtBQUssRUFBRSxPQUFPO1lBQ2QsU0FBUyxFQUFFLHlDQUFjLENBQUMsV0FBVztZQUNyQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxvQ0FBUyxDQUFDLFVBQVUsRUFBRSxvQ0FBUyxDQUFDLEdBQUcsRUFBRSxvQ0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDN0YsU0FBUyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtTQUM5QjtLQUNGO0lBQ0QsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLG9DQUFTLENBQUMsSUFBSSxFQUFFO0lBRXBDLE9BQU8sRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQ3pDLElBQUksQ0FBQztZQUNILE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsSUFBSTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXJDLElBQUksUUFBZ0IsQ0FBQztZQUNyQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FB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