
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.download = factory();
    }
}(this, function () {

    return function saveToImage(canvas) {

        var getSetting = function (callback) {
            wx.getSetting({
                success: (res) => {
                    let status = false;
                    if (res.authSetting['scope.writePhotosAlbum'] == undefined) {
                        status = true;
                    } else {
                        status = res.authSetting['scope.writePhotosAlbum']
                    }
                    if (callback) {
                        callback(status)
                    }
                }
            })
        }

        var _tempFilePath = canvas.toTempFilePathSync({
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
            // destination file sizes
            destWidth: canvas.width,
            destHeight: canvas.height,
            fileType: 'png',
            quality: 1
        });

        wx.saveImageToPhotosAlbum({
            filePath: _tempFilePath,
            success(res) {
                wx.showToast({
                    title: '保存成功'
                })
            },
            fail: (res) => {

                getSetting((status) => {
                    if (status) {
                        wx.showToast({
                            title: '保存失败',
                            icon: 'none'
                        })
                    } else {
                        wx.showToast({
                            title: '权限不足',
                            icon: 'none'
                        })
                    }
                });

            }
        })
    };
}));
