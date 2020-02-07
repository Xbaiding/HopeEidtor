
//图片大小

const { ccclass, property } = cc._decorator;

import EventDef from "../Eventdef";
import BaseComp from "../Framework/BaseComp";
@ccclass
export default class SizeView extends BaseComp {

    @property(cc.Label)
    SizeLabel: cc.Label = null;
    @property(cc.Node)
    SizeSlider: cc.Node = null;
    @property(cc.Node)
    GroundList: cc.Node = null;
    @property(cc.Node)
    GroundNode: cc.Node = null;
    @property(cc.Animation)
    Animation: cc.Animation = null;

    _showGroud: boolean = false;
    onLoad() {     
        this._register(EventDef.EVENT_SHOW_SIZEVIEW,this._onShowView );
    }
    onDestroy(){
        this._destroy(EventDef.EVENT_SHOW_SIZEVIEW,this._onShowView );
    }
    _onShowView(data: any) {
        this.node.active = true;
        this.SizeSlider.active = (data == 'OutSize');
        if ((data == 'Ground') && this.Animation) {
            this.Animation.play('showGroundL')
        }
        this._showGroundList(data == 'Ground');
    }

    _showGroundList(show){
        if(this.GroundNode == null){
            this.GroundList.active = show;
            return;
        }
        if (show != this._showGroud) {
            this._showGroud = show;
            if (show)this.GroundList.active = true;
            this.unscheduleAllCallbacks();
            this.schedule(this._showGroudBtn.bind(this), 0.05, 7, 0);
        }
    }
    _showGroudBtn(){
        for (const iterator of this.GroundNode.children) {
            if (iterator.active != this._showGroud) {
                iterator.active = this._showGroud;
                return;
            }
        }
        if (!this._showGroud){
            this.GroundList.active = false;
            this.node.active = false;
        } 
    }

    onShow(target: cc.Node, data: string) {
        if (data != '1' && this._showGroud){
            this._showGroundList(false);
        }else{
            this.node.active = (data == '1');
        }
    }

    onSetSize(target: cc.Slider) {
        if (this.SizeLabel != null) {
            this.SizeLabel.string = String(2000 + Math.floor(target.progress * 3000));
        }
    }

    onSeceltGroundBtn(event: cc.Event.EventTouch, data: string) {
        this._pushEvent(EventDef.EVENT_SET_DEFGROUND, Number(data))
    }

    onConfirmBtn() {
        this.onShow(null, "0");
        this._pushEvent(EventDef.EVENT_CAPTURE_SIZE, Number(this.SizeLabel.string));
        this._pushEvent(EventDef.EVENT_SHOW_PROMPT, { info: '请确保开启应用存储权限，图片生成时请耐心等待...', event: EventDef.EVENT_SAVE_IMAGE });
    }

}
