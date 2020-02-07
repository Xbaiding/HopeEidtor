
//drawcall 渲染优化

const { ccclass, property, menu, requireComponent } = cc._decorator;
const NodeEvent = cc.Node.EventType;

import ListItem from './ListItem'

@ccclass
@requireComponent(cc.Layout)
@menu('Extend/ListContent')
export default class ListContent extends cc.Component {

    @property({ type: cc.Integer })
    MoveCount: number = 0;

    _drawNodes: cc.Node[] = [];
    _listItem: ListItem[] = [];

    onLoad() {
        if (this.MoveCount > 0) {
            let parent = this.node.parent;
            for (let index = 0; index < this.MoveCount; index++) {
                let node = new cc.Node()
                node.zIndex = 100;
                node.parent = parent;
                this._drawNodes[index] = node;
            }
        }
    }

    start() {}
    onEnable() {
        this.node.on(NodeEvent.SIZE_CHANGED, this._sizeChanged, this);
    }
    onDisable() {
        this.node.off(NodeEvent.SIZE_CHANGED, this._sizeChanged, this);
    }

    _sizeChanged() {
        this.scheduleOnce(() => {
            this._moveNode()
        }, 0)
    }


    _moveNode() {
        for (const listItem of this._listItem ) {
            if (listItem && listItem.node) {
                for (var i = 0; i < listItem.MoveNodes.length; ++i) {
                    const node = listItem.MoveNodes[i];
                    node.parent = listItem._parent[i];
                }
            }
        }

        this._listItem = [];
        var children = this.node.children;
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            if (child.activeInHierarchy) {

                let listItem = child.getComponent(ListItem);
                if (listItem == null) continue;
                this._listItem.push(listItem);
                cc.log("_moveNode X[%d]",child.x)
                for (let index = 0; index < listItem.MoveNodes.length; index++) {
                    let node = listItem.MoveNodes[index]
                    if (node == null) continue;

                    let worldPos = listItem._getWorldSPos(index);
                    const drawNode = this._drawNodes[index];
                    let newPos = drawNode.convertToNodeSpace(worldPos);
                    node.parent = drawNode;
                    node.setPosition(newPos);

                }
            }
        }
    }


}
