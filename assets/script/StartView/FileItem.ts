
//文件列表Item

const { ccclass, property } = cc._decorator;

@ccclass
export default class FileItem extends cc.Component {

    @property(cc.Button)
    SecletBtn: cc.Button = null;
    @property(cc.Label)
    NameLabel: cc.Label = null;
    @property(cc.Label)
    WidthLabel: cc.Label = null;
    @property(cc.Label)
    HightLabel: cc.Label = null;

    @property()
    set Secelt(val: boolean) {
        if (this.SecletBtn != null) {
            this.SecletBtn.interactable = !val;
        }
    }
    get Secelt() {
        if (this.SecletBtn != null) {
            return !this.SecletBtn.interactable;
        }
        return false;
    }

    _itemIndex: number = 0;
    _seceltCallBack: (item: number) => void;
    onSeceltItem() {
        this._seceltCallBack(this._itemIndex)
    }

    _setItemIndex(index: number) {
        this._itemIndex = index;
        if (this._itemIndex % 2 == 0) {
            this.SecletBtn.normalColor = this.SecletBtn.hoverColor;
        }
    }
}
