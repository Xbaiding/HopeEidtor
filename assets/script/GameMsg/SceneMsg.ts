

import EventDef from '../EventDef'
import EventMsg from '../Framework/EventMsg'

class SceneMsg {
    private static _instance: SceneMsg;
    public static get instance(): SceneMsg {
        if (this._instance == null) {
            this._instance = new SceneMsg();
        }
        return this._instance;
    }
    private constructor() {
        EventMsg.on(EventDef.EVENT_NEWMAP_CONFIRM, this.backStartScene);
    }
    private _mapname: string = ''
    public get mapName() {
        return this._mapname;
    }
    public set mapName(name: string) {
        this._mapname = name;
    }

    private _mapSize: cc.Size = cc.Size.ZERO;
    public get mapSize() {
        return this._mapSize;
    }
    public set mapSize(size: cc.Size) {
        this._mapSize = size;
    }

    public startEditor() {
        cc.director.loadScene((cc.sys.isMobile || cc.sys.platform === cc.sys.WECHAT_GAME) ? "MobileScene.fire" : "DesktopScene.fire");
    }
    public backStartScene(val) {
        if (val != 'Confirm') return
        cc.director.loadScene('StartScene.fire');
    }
}

export default SceneMsg.instance;