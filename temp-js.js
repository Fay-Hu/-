
'use strict'

const easeInOut = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
}
class Particles {
    constructor(ele, opts) {
        ele instanceof HTMLCanvasElement ? this.canvas = ele : ele.appendChild(this.canvas = document.createElement('canvas'))

        this.ctx = this.canvas.getContext('2d')
        this._options = Object.assign({}, Particles.defaults, opts)

        this.particles = [];

        this._initCanvas()
        window.addEventListener('resize', this._initCanvas.bind(this))

        this.init()
    }

    static get defaults() {
        return {
            imgUrl: 'assets/images/test2.jpg',
            density: 4,
            duration: 100
        }
    }

    get options() {
        return this._options
    }

    set options(opts) {
        Object.assign(this._options, opts)
    }

    init() {
        let opts = this.options

        this._loadImage(this.options.imgUrl, (img) => {
            this.ctx.drawImage(img, 0, 0, img.width, img.height)
            let imgData = this.ctx.getImageData(0, 0, this.canvas.clientWidth, this.canvas.clientHeight)

            let
                density = opts.density,
                particleCols = img.width / density,
                particleRows = img.height / density

            for (let i = 0; i < particleRows; i++)
                for (let j = 0; j < particleCols; j++) {
                    var rgba = this._getRgba(imgData, i * density, j * density)
                    if (rgba[0] < 250) {
                        this.particles.push({
                            x: Math.random() * this.canvas.clientWidth,
                            y: Math.random() * this.canvas.clientHeight,
                            tX: img.x + i * density + Math.random() * density,
                            tY: img.y + j * density + Math.random() * density,
                            style: `rgba(${rgba.join(',')})`
                        })
                    }
                }

            this.animate()
        })
    }

    render() {
        let ctx = this.ctx

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.particles.forEach((v) => {
            ctx.fillStyle = v.style
            ctx.fillRect(v.x, v.y, 1, 1)
        })
    }

    animate() {
        let start = 0,
            during = this.options.duration

        let _run = () => {
            start++
            this.particles.forEach((v, i) => {
                v.x = easeInOut(start, v.x, v.tX - v.x, during)
                v.y = easeInOut(start, v.y, v.tY - v.y, during)
            })
            this.render()

            if (start < during)
                requestAnimationFrame(_run)
        }
        requestAnimationFrame(_run)
    }

    _initCanvas() {
        var
            devicePixelRatio = devicePixelRatio || 1, //dpr
            width = devicePixelRatio * this.canvas.clientWidth,
            height = devicePixelRatio * this.canvas.clientHeight

        this.canvas.setAttribute('width', width)
        this.canvas.setAttribute('height', height)

        this.canvas.style.width = width / devicePixelRatio + 'px'
        this.canvas.style.height = height / devicePixelRatio + 'px'
    }

    _loadImage(url, callback) {
        var img = new Image()
        img.src = url

        // cache 
        if (img.complete) {
            callback(img)
            return img
        }

        img.onload = () => {
            callback(img)
        }

        return img
    }

    _getRgba(imageData, i, j) {
        return [
            imageData.data[((j - 1) * imageData.width + (i - 1)) * 4],
            imageData.data[((j - 1) * imageData.width + (i - 1)) * 4 + 1],
            imageData.data[((j - 1) * imageData.width + (i - 1)) * 4 + 2],
            imageData.data[((j - 1) * imageData.width + (i - 1)) * 4 + 3]
        ]
    }
}
