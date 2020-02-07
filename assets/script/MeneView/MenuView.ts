
const { ccclass, property } = cc._decorator;

import BaseComp from '../Framework/BaseComp';
import SpriteMsg from '../GameMsg/SpritesMsg';
import EventDef from '../Eventdef';

@ccclass
export default class MenuView extends BaseComp {

    @property(cc.Button)
    RmoveBtn: cc.Button = null;
    @property(cc.Sprite)
    CurSprite: cc.Sprite = null;
    @property(cc.Node)
    HoldNode: cc.Node[] = [];
    @property(cc.Node)
    HideNode: cc.Node[] = [];
    @property(cc.Node)
    ShowNode: cc.Node[] = [];
    @property(cc.Node)
    OpenBton:cc.Node = null;

    _holdClick: boolean = false;
    _holdTime: number = 0;
    _holdTimeEc: number = 0;
    _holdName: string = '';
    _show: boolean = false;
    onLoad() {
        this._register(EventDef.EVENT_SELECT_ITEM,      this._SelectItem );
        this._register(EventDef.EVENT_SET_DEFGROUND,    this._SelectItem );
        for (const iterator of this.HoldNode) {
            iterator.on(cc.Node.EventType.TOUCH_START, this._onTouch, this);
            iterator.on(cc.Node.EventType.TOUCH_END, this._onTouch, this);
            iterator.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouch, this);
        }
    }

    onDestroy() {
        this._destroy(EventDef.EVENT_SELECT_ITEM,      this._SelectItem );
        this._destroy(EventDef.EVENT_SET_DEFGROUND,    this._SelectItem );
        for (const iterator of this.HoldNode) {
            iterator.off(cc.Node.EventType.TOUCH_START, this._onTouch, this);
            iterator.off(cc.Node.EventType.TOUCH_END, this._onTouch, this);
            iterator.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouch, this);
        }
    }

    update(dt) {
        if (this._holdClick) {
            this._holdTime += dt;
            if (this._holdTime > 0.6) {
                this._holdTimeEc += dt;
                if (this._holdTimeEc > 0.1) {
                    this._holdTimeEc = 0;
                    this._pushEvent(EventDef.EVENT_RECORD_OPERATE, this._holdName);
                }
            }
        }
    }

    _onUpdateCurBG(data: any) {
        this.CurSprite.spriteFrame = SpriteMsg.getInstance().getBiomeSpriteFrame(data, 1);;
    }
    _SelectItem(itemIndex: number) {
        if (this.RmoveBtn != null) {
            this.RmoveBtn.interactable = (itemIndex != -1);
        }
    }

    _onTouch(event: cc.Event.EventTouch) {
        if (event.type == cc.Node.EventType.TOUCH_START) {
            this._holdClick = true;
            this._holdTime = 0;
            this._holdTimeEc = 0;
            this._holdName = event.target.getName();
        } else {
            this._holdClick = false;
            this._holdTime = 0;
            this._holdTimeEc = 0;
        }
    }

    onRemoveBtn() {
        this._pushEvent(EventDef.EVENT_SELECT_ITEM, -1);
    }
    onScaleBtn(target: cc.Button, data: string) {
        this._pushEvent(EventDef.EVENT_SCALE_MAP, Number(data));
    }
    onEyeBtn(target: cc.Toggle, data: string) {
        this._pushEvent(EventDef.EVENT_HIDE_FRAME, (!target.isChecked));
    }
    onNewBtn() {
        this._pushEvent(EventDef.EVENT_SHOW_PROMPT, { info: '是否确认新建?', event: EventDef.EVENT_NEWMAP_CONFIRM });
    }
    onSaveBtn() {
        this._pushEvent(EventDef.EVENT_SAVE_FILE, -1);
    }
    onImagBtn() {
        this._pushEvent(EventDef.EVENT_SHOW_SIZEVIEW, 'OutSize');
    }
    onGroundBtn() {
        this._pushEvent(EventDef.EVENT_SHOW_SIZEVIEW, 'Ground');
    }
    onRecordBtn(target: cc.Toggle, data: string) {
        this._pushEvent(EventDef.EVENT_RECORD_OPERATE, data);
    }
    onMiniMap(){
        this._pushEvent(EventDef.EVENT_SET_MINIMAP);
    }
    onShowBtn(event) {
        let scaleY = this._show ? 1 : -1;
        event.target.setScale(1, scaleY);
        this._show = !this._show;
        this.unscheduleAllCallbacks();
        this.schedule(this._changeBtn.bind(this), 0.05, 10, 0);
    }
    _changeBtn(){
        //利用 父节点Layout特性实现抽屉效果
        if (this._show) {
            if (this._changNode(this.ShowNode,!this._show)) {
                this._changNode(this.HideNode,this._show)
            }
        }else{
            if (this._changNode(this.HideNode,this._show)) {
                this._changNode(this.ShowNode,!this._show)
            }
        }
    }
    _changNode(nodes:cc.Node[],show:boolean){
        for (const iterator of nodes) {
            if (iterator.active != show) {
                iterator.active = show;
                return false;
            }
        }
        return true;
    }
}
