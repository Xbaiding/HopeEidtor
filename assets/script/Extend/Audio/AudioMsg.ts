
const { ccclass, property } = cc._decorator;


@ccclass
export default class AudioMsg extends cc.Component {

    private static _instance: AudioMsg;
    public static getInstance(): AudioMsg {
        if (this._instance == null) {
            this._instance = new AudioMsg();
        }
        return this._instance;
    }
    private constructor() {
        super();
    }

    __preload() {
        if (AudioMsg._instance == null) {
            AudioMsg._instance = this;
        }
    }
    @property({ type: cc.AudioClip })
    AudioClips: cc.AudioClip[] = [];

    playAudio(index: number, volume: number = 1) {
        if (this.AudioClips[index]) {
            cc.audioEngine.play(this.AudioClips[index], false, volume);
        }
    }

}
