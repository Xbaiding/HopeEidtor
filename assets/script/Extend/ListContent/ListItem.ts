

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu('Extend/ListItem')
export default class ListItem extends cc.Component {

    @property({ type: cc.Node })
    MoveNodes: cc.Node[] = [];

    _parent: cc.Node[] = [];
    _oldPos: cc.Vec2[] = [];

    onLoad() {
        for (let index = 0; index < this.MoveNodes.length; index++) {
            const node = this.MoveNodes[index];
            if(node == null)continue;
            this._parent[index] = node.parent;
            this._oldPos[index] = cc.v2(node.position);
            
        }
    }

    _getWorldSPos(index):cc.Vec2{
        const pos = this._oldPos[index];
        const node = this._parent[index];
        return node.convertToWorldSpaceAR(pos);
    }

}
