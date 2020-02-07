
//截图

const { ccclass, property } = cc._decorator;

import EventDef from '../EventDef';
import BaseComp from '../Framework/BaseComp'
import SceneMsg from '../GameMsg/SceneMsg'
import * as wechatSaveImage from './wechat.js';

@ccclass
export default class MapCapture extends BaseComp {

    @property(cc.Camera)
    mapCamera: cc.Camera = null;

    _mapname: string = null;

    _captrueSize: number = 2000;
    private _texture: cc.RenderTexture = null;

    onLoad() {
        this.node.active = false;
        this._register(EventDef.EVENT_CAPTURE_SIZE, this._setCaptrueSize);
        this._register(EventDef.EVENT_SAVE_IMAGE, this._captureMap);
    }
    onDestroy() {
        this._destroy(EventDef.EVENT_CAPTURE_SIZE, this._setCaptrueSize);
        this._destroy(EventDef.EVENT_SAVE_IMAGE, this._captureMap);
    }
    _setCaptrueSize(data) {
        this._captrueSize = data;
    }
    //截取屏幕
    _captureMap(val) {
        if (val != 'Confirm') return;

        let scale = 1,
            width = SceneMsg.mapSize.width * 100,
            height = SceneMsg.mapSize.height * 100;

        if (width > height) {
            if (width > this._captrueSize) scale = this._captrueSize / width
        } else {
            if (height > this._captrueSize) scale = this._captrueSize / height;
        }
        width *= scale;
        height *= scale;
        scale *= (cc.visibleRect.height / height);

        this.mapCamera.zoomRatio = scale;

        this.node.active = true;

        this.mapCamera.targetTexture = null;
        this._texture = new cc.RenderTexture();

        this._texture.update({ format: cc.Texture2D.PixelFormat.RGB565 });
        this._texture.initWithSize(width, height);

        this.mapCamera.targetTexture = this._texture;
        this._pushEvent(EventDef.EVENT_SHOW_PROMPT, { info: '正在生成图片请等待', type: 2 });
        //延迟一帧等待渲染后保存图片
        this.scheduleOnce(() => {

            if (cc.sys.isBrowser || cc.sys.platform === cc.sys.WECHAT_GAME) {
                this._saveImageWeb();
            } else {
                this._saveToFile();
            }

        }, 0)
    }

    _saveToFile() {
        let fileName = this._mapname + '.jpg';
        let filePath = jsb.fileUtils.getWritablePath() + fileName;
        let tipStr = '图片生成失败';
        if (this._saveImage(filePath)) {
            tipStr = '图片生成成功';
            if (cc.sys.platform == cc.sys.ANDROID) {
                var result = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/Utils", "saveImage", "(Ljava/lang/String;Ljava/lang/String;)Z", filePath, fileName);
                if (result) {
                    tipStr = '图片导出成功';
                } else {
                    tipStr = '图片导出成功';
                }
                jsb.fileUtils.removeFile(filePath);
            }
        }
        this._pushEvent(EventDef.EVENT_SHOW_PROMPT, { info: tipStr, type: 1 });
        this.node.active = false;
    }

    //原生平台保存图片
    _saveImage(filePath: string) {

        let x = 0, y = 0;
        let width = this._texture.width;
        let height = this._texture.height;
        let ret = true;
        let gl = window["__gl"];
        let oldFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._texture['_framebuffer']._glID);
        if (CC_DEBUG) {
            //Debug 模拟器用原先接口
            //图片是倒置的所以需要截图前先翻转y轴
            let data = new Uint8Array(width * height * 4);
            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

            //上下翻转
            let rowBytes = width * 4;
            let len = Math.floor(height / 2);
            let temp = new Uint8Array(rowBytes);
            for (let y = 0; y < len; ++y) {
                let topOffset = y * rowBytes;
                let bottomOffset = (height - y - 1) * rowBytes;
                temp.set(data.subarray(topOffset, topOffset + rowBytes))
                data.copyWithin(topOffset, bottomOffset, bottomOffset + rowBytes);
                data.set(temp, bottomOffset);
            }
            ret = jsb.saveImageData(data, width, height, filePath)
        } else {
            //修改 gl.readPixels 实现直接生成文件
            //无需翻转生成时自动翻转
            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, filePath);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, oldFBO);

        return ret;
    }

    //web保存图片
    _saveImageWeb() {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let width = canvas.width = this._texture.width;
        let height = canvas.height = this._texture.height;

        canvas.width = this._texture.width;
        canvas.height = this._texture.height;

        let data = this._texture.readPixels();
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let imageData = ctx.createImageData(width, 1);
            let start = srow * width * 4;
            for (let i = 0; i < rowBytes; i++) {
                imageData.data[i] = data[start + i];
            }
            ctx.putImageData(imageData, 0, row);
        }

        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            //微信小游戏
            wechatSaveImage(canvas)
        } else if (cc.sys.isMobile) {
            //手机浏览器
            let base64 = canvas.toDataURL("image/jpeg");
            var w = window.open('about:blank', 'image from canvas');
            w.document.write("<img src='" + base64 + "' alt='from canvas'/>");
        } else {
            //下载图片
            let dataURIToBlob = function (dataURI) {
                var binStr = atob(dataURI.split(',')[1]),
                    len = binStr.length,
                    arr = new Uint8Array(len);

                for (var i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }
                return new Blob([arr]);
            }
            let blob = dataURIToBlob(canvas.toDataURL("image/jpeg"));

            var a = document.createElement('a');
            a.download = this._mapname + '.jpeg';
            a.innerHTML = 'download';
            a.href = URL.createObjectURL(blob);
            var event = new MouseEvent('click', { "bubbles": false, "cancelable": false });
            a.dispatchEvent(event);

        }
    }

}
