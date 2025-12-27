"""
Python Microservice for Shot Boundary Detection
使用 PySceneDetect 進行分鏡檢測
"""

from flask import Flask, request, jsonify
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector
import os

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """健康檢查端點"""
    return jsonify({'status': 'ok', 'service': 'shot-detection'}), 200


@app.route('/detect-shots', methods=['POST'])
def detect_shots():
    """
    檢測影片分鏡
    Request body: { "video_path": "/path/to/video.mp4" }
    Response: { "shots": [{"shot": 1, "start": 0.0, "end": 2.1}, ...] }
    """
    try:
        data = request.get_json()
        video_path = data.get('video_path')

        if not video_path:
            return jsonify({'error': 'video_path is required'}), 400

        if not os.path.exists(video_path):
            return jsonify({'error': 'Video file not found'}), 404

        # 初始化 VideoManager 和 SceneManager
        video_manager = VideoManager([video_path])
        scene_manager = SceneManager()
        
        # 添加 ContentDetector（基於內容變化檢測分鏡）
        # threshold 越低越敏感，默認 30
        scene_manager.add_detector(ContentDetector(threshold=27.0))

        # 開始檢測
        video_manager.start()
        scene_manager.detect_scenes(frame_source=video_manager)

        # 獲取場景列表
        scene_list = scene_manager.get_scene_list()

        # 格式化輸出
        shots = []
        for i, scene in enumerate(scene_list, start=1):
            start_time = scene[0].get_seconds()
            end_time = scene[1].get_seconds()
            
            shots.append({
                'shot': i,
                'start': round(start_time, 2),
                'end': round(end_time, 2)
            })

        # 釋放資源
        video_manager.release()

        return jsonify({
            'success': True,
            'shots': shots,
            'total_shots': len(shots)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
