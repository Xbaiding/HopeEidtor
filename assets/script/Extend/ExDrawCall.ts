
//渲染优化
//将需要优化的节点移动到该节点下以降低 DrawCall

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu('Extend/ExDrawCall')
export default class ExDrawCall extends cc.Component {

    //需要渲染优化移动的节点
    @property({ type: cc.Node })
    MoveNodes: cc.Node[] = [];

    @property()
    AutoMove: boolean = false;

    _index: number = -1;
    _parent: cc.Node[] = [];
    _oldPos: cc.Vec2[] = [];

    onInit() {
        for (let i = 0; i < this.MoveNodes.length; i++) {
            const node = this.MoveNodes[i];
            if (node == null) continue;
            this._parent[i] = node.parent;
            this._oldPos[i] = cc.v2(node.position);
        }
    }

    onEnable() {
        if (this.AutoMove) {
            this.onInit();
        }
    }

    getWorldSPos(index): cc.Vec2 {
        const pos = this._oldPos[index];
        const node = this._parent[index];
        return node.convertToWorldSpaceAR(pos);
    }

    start() {
        if (this.AutoMove) {
            for (let i = 0; i < this.MoveNodes.length; i++) {
                const node = this.MoveNodes[i];
                if (node == null) continue;

                let worldPos = this.getWorldSPos(i);
                let newPos = this.node.convertToNodeSpaceAR(worldPos);
                node.parent = this.node;
                node.setPosition(newPos);
            }
        }
    }
}
