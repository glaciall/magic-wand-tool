/**
 * Created by matrixy on 2018/2/3.
 */

var WandTool = {

    canvas : null,
    context : null,
    bitmap : null,
    offset : null,
    eraser : { path : [], down : false, sampleColors : { } },

    painterContext : null,

    // 初始化
    init : function(canvas)
    {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
    },

    // 加载图片
    loadImage : function(url)
    {
        var self = this;
        var img = new Image();
        img.onload = function()
        {
            self.canvas.width = this.width;
            self.canvas.height = this.height;
            self.context.drawImage(this, 0, 0);
            self.bitmap = self.context.getImageData(0, 0, this.width, this.height);
            self.offset = $(self.canvas).offset();

            // 用于显示画笔轨迹
            var canvas = document.createElement('CANVAS');
            canvas.style.position = 'absolute';
            canvas.style.zIndex = 10000;
            canvas.style.pointerEvents = 'none';
            canvas.width = this.width;
            canvas.height = this.height;
            canvas.style.top = self.offset.top + 'px';
            canvas.style.left = self.offset.left + 'px';
            document.body.appendChild(canvas);

            // 绑定鼠标事件
            self.__initSampler(canvas.getContext('2d'));
        }
        img.src = url;
    },

    // 启用画笔采样工具
    sampling : function()
    {

    },

    // 边缘查找
    tracing : function()
    {

    },

    // 事件绑定
    __initSampler : function(samplerContext)
    {
        // 事件绑定
        var self = this;
        // 好像是canvas相对于body的偏移位置
        var offset = { top : 0, left : 0 };
        this.canvas.addEventListener('mousemove', function(e)
        {
            if (self.eraser.down)
            {
                var p = { x : parseInt(e.x - offset.left), y : parseInt(e.y - offset.top) };
                self.eraser.path.push(p);
                var color = self.getColor(p.x, p.y);
                color.x = p.x;
                color.y = p.y;
                self.eraser.sampleColors['c' + color.hex] = color;
            }
            if (self.eraser.path.length < 2) return;
            var ctx = samplerContext;
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffffff';
            ctx.moveTo(self.eraser.path[0].x, self.eraser.path[0].y);
            for (var i = 1; i < self.eraser.path.length; i++)
            {
                var p = self.eraser.path[i];
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        });
        this.canvas.addEventListener('mousedown', function(e)
        {
            self.eraser.down = true;
            self.eraser.path = [];
            self.eraser.sampleColors = {};
        });

        this.canvas.addEventListener('mouseup', function()
        {
            if (self.eraser.down) self.pervade();
            self.eraser.down = false;
        });

        this.canvas.addEventListener('mouseover', function()
        {
            self.eraser.down = false;
        });
    },

    // 相似色渗透
    pervade : function()
    {
        console.log('xxoo');
    },

    /**
     * 查找目标颜色与采样颜色的相似度
     * @param r 目标颜色的RED
     * @param g 目标颜色的GREEN
     * @param b 目标颜色的BLUE
     * @param min 最小相似度阈值
     * @returns {*}
     */
    colorMatchers : function(r, g, b, min)
    {
        var start = 0;
        var end = self.eraser.sampleColors.length;
        var mid = 0;
        for (var i = 0; i < self.eraser.sampleColors.length; i++)
        {
            var mid = parseInt(start + (end - start) / 2);
            var left = parseInt(start + (mid - start) / 2);
            var right = parseInt(mid + (end - mid) / 2);

            var ldiff = self.colorDiff(r, g, b, self.eraser.sampleColors[left].r, self.eraser.sampleColors[left].g, self.eraser.sampleColors[left].b);
            var rdiff = self.colorDiff(r, g, b, self.eraser.sampleColors[right].r, self.eraser.sampleColors[right].g, self.eraser.sampleColors[right].b);
            if (ldiff < min) return ldiff;
            if (rdiff < min) return rdiff;
            if (ldiff < rdiff)
            {
                end = right;
            }
            else
            {
                start = left;
            }
        }
        return Number.MAX_VALUE;
    },

    /**
     * 计算两个颜色的欧式距离来得到颜色的相似度
     * @param x, y, z : 颜色A的RGB分量
     * @param r, g, b : 颜色B的RGB分量
     * @returns {number}
     */
    colorDiff : function(x, y, z, r, g, b)
    {
        return Math.sqrt(Math.pow(x - r, 2) + Math.pow(y - g, 2) + Math.pow(z - b, 2));
    },

    getColor : function(p)
    {
        if (p == null) return null;
        var index = (p.y * this.bitmap.width + p.x) * 4;
        return {
            r: this.bitmap.data[index],
            g: this.bitmap.data[index + 1],
            b: this.bitmap.data[index + 2],
            a: this.bitmap.data[index + 3]
        };
    },

    setColor : function(p, rgba)
    {
        var index = (p.y * this.bitmap.width + p.x) * 4;
        this.bitmap.data[index] = (rgba >> 16) & 0xff;
        this.bitmap.data[index + 1] = (rgba >> 8) & 0xff;
        this.bitmap.data[index + 2] = (rgba) & 0xff;
        this.bitmap.data[index + 3] = 0xff;
    },

    /**
     * 比较两个颜色c1和c2是否相等
     * @param c1
     * @param c2
     * @returns {boolean}
     */
    compareColor : function(c1, c2)
    {
        return c1.r == c2.r && c1.g == c2.g && c1.b == c2.b;
    }
};