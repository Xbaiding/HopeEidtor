

// 界面管理器

const { ccclass, property, menu } = cc._decorator;

@ccclass('ViewInfo')
export class ViewInfo {
    @property({ tooltip: '界面名称' })
    ViewName: string = '';
    @property({ tooltip: '默认显示' })
    active: boolean = true;
    @property({ tooltip: '界面层级' })
    ZOrder: number = 0;
    @property({ type: cc.Prefab, tooltip: '预制界面' })
    prefab: cc.Prefab = null;
}

@ccclass
@menu('Extend/RootView')
export default class RootView extends cc.Component {

    @property(ViewInfo)
    UiViews: ViewInfo[] = []

    start(){
        this._addNodes()
    }
    _addNodes(){
        for (const view of this.UiViews) {
            if (view.prefab) {
                let node = cc.instantiate(view.prefab);
                this.node.addChild(node);
                node.zIndex = view.ZOrder;
                node.active = view.active;
            }
        }
    }
}
