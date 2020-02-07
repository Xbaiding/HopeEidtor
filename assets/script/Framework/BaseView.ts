const { ccclass, property,requireComponent } = cc._decorator;

import BaseComp from "./BaseComp";

@ccclass
@requireComponent(cc.Animation)
export default class BaseView extends BaseComp {

    onShow(){
        this.node.active = true;
        let animation = this.node.getComponent(cc.Animation);
        if (animation) {
            animation.play('show')
        }
    }

    onHide(){
        let animation = this.node.getComponent(cc.Animation);
        if (animation) {
            animation.play('hide')
        }else{
            this._onHide();
        }
    }
    _onHide(){
        this.node.active = false;
    }
}
