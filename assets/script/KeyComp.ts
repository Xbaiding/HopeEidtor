
//快捷健

const { ccclass, property } = cc._decorator;

import BaseComp from './Framework/BaseComp'
import EventDef from './Eventdef';

const KEY_TYPE = cc.macro.KEY;

@ccclass
export default class KeyComp extends BaseComp {

    _ctrl: boolean = false;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this._onKeyUp, this);
    }
    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyUp, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this._onKeyUp, this);
    }
    _onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case KEY_TYPE.ctrl:
            case 91:
                this._ctrl = true;
                break;
            case KEY_TYPE.z: {
                if (this._ctrl) {
                    this._pushEvent(EventDef.EVENT_RECORD_OPERATE, 'UnDo');
                } else {
                    this._pushEvent(EventDef.EVENT_RECORD_OPERATE, 'ReDo');
                }
            }
                break;
            case KEY_TYPE.a:
            case KEY_TYPE.left:
                this._pushEvent(EventDef.EVENT_MOVE_MAP, cc.v2(-10, 0));
                break;
            case KEY_TYPE.d:
            case KEY_TYPE.right:
                this._pushEvent(EventDef.EVENT_MOVE_MAP, cc.v2(10, 0));
                break;
            case KEY_TYPE.w:
            case KEY_TYPE.up:
                this._pushEvent(EventDef.EVENT_MOVE_MAP, cc.v2(0, 10));
                break;
            case KEY_TYPE.down:
                this._pushEvent(EventDef.EVENT_MOVE_MAP, cc.v2(0, -10));
                break;
            case KEY_TYPE.s: {
                if (this._ctrl)
                    this._pushEvent(EventDef.EVENT_SAVE_FILE, -1);
                else
                    this._pushEvent(EventDef.EVENT_MOVE_MAP, cc.v2(0, -10));
            }
                break;
            default:
                break;
        }
    }
    _onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case KEY_TYPE.ctrl:
            case 91:
                this._ctrl = false;
                break;
            case KEY_TYPE.c:
                this._pushEvent(EventDef.EVENT_SELECT_ITEM, -1);
                break;
            case KEY_TYPE.x:
                this._pushEvent(EventDef.EVENT_HIDE_FRAME, null);
                break;
            case KEY_TYPE.q:
                this._pushEvent(EventDef.EVENT_SCALE_MAP, 0.9);
                break;
            case KEY_TYPE.e:
                this._pushEvent(EventDef.EVENT_SCALE_MAP, 1.1);
                break;
            default:
                break;
        }
    }
}
