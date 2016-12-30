/**
 * 
 *
 *
 * @memberOf UCD
 * @class Workflow
 * @augments UCD.Widget
 *
 * @param {Object} container    组件容器
 * @param {Object} options      选项
 * @param {Object} [options.disabled=false]      是否禁用
 * @param {Function} [options.create=null] 创建后回调
 */
UCD.registerWidget('Workflow', function(SUPER) {
	var $ = UCD.require('jquery');

	var
		NS_svg = "http://www.w3.org/2000/svg";

	var
		_getUID = function(prefix) {
			do {
				prefix += ~~(Math.random() * 1000000)
			} while (document.getElementById(prefix));
			return prefix;
		},
		_createNS = function(tagName, attrs) {
			var $node = $(document.createElementNS(NS_svg, tagName));
			if (attrs) {
				$node.attr(attrs);
			}
			return $node;
		},
		/**
		 * 模板字符串替换，变量用${v}表示
		 *
		 * @param      {string}  string     模板字符串
		 * @param      {array}  variables   字符串变量数组
		 * @return     {string}  The string.
		 */
		getTplString = function(string, variables) {
			var serial = 0;

			return string.replace(/\$\{\w+\}/g, function() {
				return variables[serial++];
			});
		};

	var
		CLASSES = {
			presetStage: 'workflow-preset-stage',
			lineWrap: 'workflow-line-wrap',
			line: 'workflow-line',
			preset: 'workflow-preset'
		},
		ATTRS = {
			icon: 'data-task-icon',
			label: 'data-task-label'
		},
		SELECTORS = {
			item: '.workflow',
			itemStart: '.start',
			itemEnd: '.end',
			itemSorE: '.workflow.start,.workflow.end',
			lineWrap: '.workflow-line-wrap',
			line: '.workflow-line',
			dissmiss: '[data-dissmiss="workflow"]'
		},
		DATA = {
			fromLines: 'workflow.fromLines',
			toLines: 'workflow.toLines',
			fromNodes: 'workflow.fromNodes',
			toNodes: 'workflow.toNodes',
			lineFrom: 'worckflow.lineFrom',
			lineTo: 'worckflow.lineTo'
		},
		TEMPLATE = [
			'<div class="workflow">',
			'	<div class="workflow-content">',
			'		<span class="btn-close" data-dissmiss="workflow"><i class="icon icon-reset"></i></span>',
			'		<div class="workflow-img"><i class="icon ${icon}"></i></div>',
			'		<p class="label" contenteditable="true">${label}</p>',
			'	</div>',
			'	<div class="workflow-footer">',
			'		<i class="workflow-pointer icon icon-pointer"></i>',
			'	</div>',
			'</div>'
		].join('');
	return {
		options: {
			draggableSelector: '[data-dragtype="workflow"]',
			dropContainerSelector: '',
			arrowSize: 8,
			onIllegalLine: $.noop,
			enableDrop: function(e, $el, $source) {
				return true;
			}
		},

		_create: function() {
			SUPER._create.call(this);

			this.$dropContainer = this.options.dropContainerSelector === '' ? this.element : this.element.find(this.options.dropContainerSelector);
		},

		_init: function() {
			this.$branchingLine = _createNS('svg', {
					class: [CLASSES.lineWrap, CLASSES.presetStage].join(' '),
					'pointer-events': 'none'
				})
				.append(_createNS('path').attr({
					class: [CLASSES.line, CLASSES.preset].join(' ')
				}))
				.appendTo(this.$dropContainer);

			this._bindEvents();
			this.$dropContainer.find(SELECTORS.item).draggabilly().on('dragMove', $.proxy(this._handleDragItem, this));

			this.$dropContainer.find(SELECTORS.itemSorE).data(this._getInitDataKeys());

			return this;
		},
		_bindEvents: function() {
			var self = this;
			this.document.on('dragstart', this.options.draggableSelector, function(e) {

				var $this = $(e.target);

				if (!$this.attr('id')) $this.attr('id', _getUID('workflow-item-'));

				e = e.originalEvent;
				e.dataTransfer.setData("Text", $this.attr('id'));
			});

			this._on(this.$dropContainer, {
				'dragover': '_handleDragover',
				'drop': '_handleDrop',
				'mousedown .workflow-pointer': '_handleBranchMousedown',
				'mousemove': '_handleBranchMousemove',
				'mouseout': '_clearPreset',
				'mouseup': '_handleBranchMouseup',
				'dblclick .workflow-line-wrap': '_handleLineDblClick'
			});
		},
		_handleDragover: function(e) {
			e.preventDefault();
		},
		_handleDrop: function(e) {
			var originalE = e.originalEvent;

			e.preventDefault();
			e.stopPropagation();

			var
				offset = this.$dropContainer.offset(),
				$target = $(document.getElementById(e.originalEvent.dataTransfer.getData("Text")));
			//防止其他结构意外拖入
			if (!$target.is(this.options.draggableSelector)) {
				return false;
			}

			var newItem = this._createItem($target.attr(ATTRS.icon), $target.attr(ATTRS.label) || $target.text());
			//是否允许drop回调
			if (!this.options.enableDrop.call(this, e, newItem, $target)) {
				return false;
			}
			this.$dropContainer.append(newItem.draggabilly()
					.on('dragMove', $.proxy(this._handleDragItem, this))
					.css({
						position: 'absolute',
						left: originalE.pageX - offset.left,
						top: originalE.pageY - offset.top
					}))
				.on('click', SELECTORS.dissmiss, $.proxy(this._handleItemDissmiss, this));

			return this;
		},
		_handleItemDissmiss: function(e) {
			var $item = $(e.target).closest(SELECTORS.item);

			this.deleteNode($item);
		},
		_handleBranchMousedown: function(e) {
			var
				originalE = e.originalEvent,
				offset = this.$dropContainer.offset();

			e.stopPropagation();
			e.preventDefault();

			this.$brachingStart = $(e.target).closest(SELECTORS.item);

			if (this.$brachingStart.is(SELECTORS.itemEnd)) return false;
			this.branching = true;
			this.brachingStart = [originalE.pageX - offset.left, originalE.pageY - offset.top];
		},
		_handleBranchMousemove: function(e) {
			if (!this.branching) return;

			this.drawBranch = false;
			e.stopPropagation();
			e.preventDefault();

			var
				originalE = e.originalEvent,
				offset = this.$dropContainer.offset(),
				cx = originalE.pageX - offset.left,
				cy = originalE.pageY - offset.top,
				$target = $(e.target).closest(SELECTORS.item);

			this._clearPreset();

			if ($target.length && !$target.is(this.$brachingStart)) {
				this.$dropContainer.append(this.$presetLine = this._createLine(this.$brachingStart, $target).data(DATA.lineFrom, this.$brachingStart).data(DATA.lineTo, $target));
				this.drawBranch = true;
			} else {
				this.$branchingLine.find('path').attr({
					d: this._getLinePath(this.brachingStart, [cx, cy])
				});
				this.$branchingLine.css({
					left: this.$dropContainer.scrollLeft(),
					top: this.$dropContainer.scrollTop()
				});
			}
		},

		_handleBranchMouseup: function(e) {
			if (!this.branching) return;

			this.branching = false;

			(this.drawBranch && this.$presetLine) && this.addLine(this.$presetLine.clone(true).attr('class', CLASSES.lineWrap));

			this._clearPreset();
		},
		_handleLineDblClick: function(e) {
			$(e.target).closest('svg').remove();
		},
		_handleDragItem: function(e, pointer, moveVector) {
			this.resetLines.call(this, $(e.currentTarget));
		},

		/**
		 * 根据起点和终点获取连线路径
		 * @param {Object} startP
		 * @param {Object} endP
		 * @param {Object} isVertical
		 */
		_getLinePath: function(startP, endP, isVertical) {
			var
				arrowDiffW = this.options.arrowSize,
				arrowDiffH = Math.round(arrowDiffW * 3 / 4),
				arrowDiff = Math.round(arrowDiffW / 3 * 4),
				symbolX = endP[0] - startP[0] > 0 ? 1 : -1,
				symbolY = endP[1] - startP[1] > 0 ? 1 : -1,
				arrowPointTop = [endP[0] - symbolX * arrowDiffW, endP[1] + arrowDiffH],
				arrowPointBottom = [arrowPointTop[0], endP[1] - arrowDiffH],
				arrowPointLeft = [endP[0] - arrowDiffH, endP[1] - symbolY * arrowDiffW],
				arrowPointRight = [endP[0] + arrowDiffH, arrowPointLeft[1]];

			if (isVertical) {
				return [
					'M', startP.join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiff].join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiffW].join(','),
					'L', arrowPointLeft.join(','), 'L', endP.join(','), 'L', arrowPointRight.join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiffW].join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiff].join(','), 'Z'
				].join(' ');
			} else {
				return [
					'M', startP.join(','), 'L', [endP[0] - symbolX * arrowDiff, endP[1]].join(','), 'L', [endP[0] - symbolX * arrowDiffW, endP[1]].join(','),
					'L', arrowPointTop.join(','), 'L', endP.join(','), 'L', arrowPointBottom.join(','), 'L', [endP[0] - symbolX * arrowDiffW, endP[1]].join(','), 'L', [endP[0] - symbolX * arrowDiff, endP[1]].join(','), 'Z'
				].join(' ');
			}
		},
		/**
		 * 根据起点和终点dom结构获取连线路径
		 * @param {Object} $start
		 * @param {Object} $end
		 */
		_getLinePathFromEle: function($start, $end) {
			var
				scrollTop = this.$dropContainer.scrollTop(),
				scrollLeft = this.$dropContainer.scrollLeft(),
				startX = $start.position().left + scrollLeft,
				startY = $start.position().top + scrollTop,
				endX = $end.position().left + scrollLeft,
				endY = $end.position().top + scrollTop,
				xMin = Math.min(startX, endX),
				yMin = Math.min(startY, endY),
				deltaX = endX - startX,
				deltaY = endY - startY,
				//在左边的item
				L = deltaX >= 0 ? $start : $end,
				L_left = L.position().left + scrollLeft,
				L_top = L.position().top + scrollTop,
				//在右边的item
				R = deltaX < 0 ? $start : $end,
				R_left = R.position().left + scrollLeft,
				R_top = R.position().top + scrollTop,
				T = deltaY >= 0 ? $start : $end,
				B = deltaY < 0 ? $start : $end;

			var arrowSize = this.options.arrowSize;

			var path, lineStart, lineEnd;
			//判断左右连线还是上下连线
			if (R_left - L_left <= L.width()) {
				lineStart = [L.width() / 2, L_top - yMin + (L.is(T) ? L.height() : 0)];
				lineEnd = [R_left - xMin + R.width() / 2, R_top - yMin + (R.is(T) ? R.height() : 0)];
				path = deltaY > 0 ? this._getLinePath(lineStart, lineEnd, true) : this._getLinePath(lineEnd, lineStart, true);
			} else {
				lineStart = [L.width(), L_top - yMin + L.height() / 2];
				lineEnd = [R_left + scrollLeft - xMin, R_top - yMin + R.height() / 2];
				path = deltaX > 0 ? this._getLinePath(lineStart, lineEnd) : this._getLinePath(lineEnd, lineStart);
			}

			return {
				path: path,
				//包裹线的svg的样式
				wrapCss: {
					width: Math.max(lineStart[0], lineEnd[0]) + arrowSize,
					height: Math.max(lineStart[1], lineEnd[1]) + arrowSize,
					left: xMin,
					top: yMin
				}
			}
		},
		/**
		 * 
		 * @param {Object} $start
		 * @param {Object} $end
		 */
		_createLine: function($start, $end) {
			var linePath = this._getLinePathFromEle($start, $end);

			var $line = _createNS('svg', {
					class: CLASSES.lineWrap,
					'pointer-events': 'none'
				})
				.css(linePath.wrapCss)
				.append(_createNS('path', {
					class: CLASSES.line,
					'pointer-events': "visibleStroke",
					d: linePath.path
				}));

			return $line;
		},
		_getInitDataKeys: function() {
			var keys = {};

			keys[DATA.fromLines] = [];
			keys[DATA.toLines] = [];
			keys[DATA.fromNodes] = [];
			keys[DATA.toNodes] = [];

			return keys;
		},
		_createItem: function() {

			return $(getTplString(TEMPLATE, arguments)).clone().data(this._getInitDataKeys());
		},
		_clearPreset: function() {
			this.$presetLine && this.deleteLine(this.$presetLine);
			this.$branchingLine.find('path').attr({
				d: ''
			});
		},
		/**
		 * 
		 * @param {Array} lines
		 */
		_deleteLines: function(lines) {
			if (!$.isArray(lines)) return;

			var self = this;
			$.each(lines, function(i, v) {
				self.deleteLine($(v));
			});
		},
		/**
		 * 添加连线
		 * @param {Object} $start 开始节点，如果传入一个参数，则视该参数为连线
		 * @param {Object} $end  结束节点
		 */
		addLine: function($start, $end) {
			var $presetLine;
			if ($start.is(SELECTORS.lineWrap)) {
				$presetLine = $start;
				$start = $presetLine.data(DATA.lineFrom);
				$end = $presetLine.data(DATA.lineTo);
			} else {
				$presetLine = this._createLine($start, $end).data(DATA.lineFrom, $start).data(DATA.lineTo, $end);
			}

			//TODO inArray
			//if (~$.inArray($end, $start.data(DATA.fromNodes)) || ~$.inArray($end, $start.data(DATA.toNodes))) return this.options.onIllegalLine.call(this, $start, $end);

			this.$dropContainer.append($presetLine);
			$start.data(DATA.fromLines).push($presetLine);
			$start.data(DATA.toNodes).push($end);
			$end.data(DATA.toLines).push($presetLine);
			$end.data(DATA.fromNodes).push($start);
		},
		/**
		 * 删除连线
		 * @param {Object} $line
		 */
		deleteLine: function($line) {
			($line instanceof $) && $line.off().remove();
		},
		/**
		 * 删除节点
		 * @param {Object} $node
		 */
		deleteNode: function($node) {
			this._deleteLines($node.data(DATA.fromLines));
			this._deleteLines($node.data(DATA.toLines));
			$node.data('draggabilly') && $node.data('draggabilly').destroy();
			$node.remove();
		},
		/**
		 * 重置线条
		 * @param {Object} $node 节点
		 */
		resetLines: function($node) {
			var self = this;

			if ($node) {
				//遍历节点相关连线 ,重新绘制
				$.each($node.data(DATA.fromLines).concat($node.data(DATA.toLines)), function(i, v) {
					var
						$line = $(v),
						linePath = self._getLinePathFromEle($line.data(DATA.lineFrom), $line.data(DATA.lineTo));

					$line.css(linePath.wrapCss).find(SELECTORS.line).attr('d', linePath.path);
				});
			}
		}
	};
});
