
const { ccclass, property, menu } = cc._decorator;

import AudioMsg from './AudioMsg'
import AudioIndex from './AudioIndex'

@ccclass
@menu('Extend/ClickAudio')
export default class ClickAudio extends cc.Component {

    @property
    _audiotype: AudioIndex = AudioIndex.COM_CLICK;
    @property({ type: cc.Enum(AudioIndex) })
    set AudioType(type: AudioIndex) {
        this._audiotype = type;
    }
    get AudioType() { return this._audiotype; };

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this._play, this);
    }
    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this._play, this);
    }
    _play() {
        AudioMsg.getInstance().playAudio(this._audiotype);
    }

}
