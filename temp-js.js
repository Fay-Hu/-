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

			if(attrs) {
				$node.attr(attrs);
			}
			return $node;
		},
		_inArray = function(obj, array) {
			var index = -1;

			$.each(array, function(i, v) {
				if(obj instanceof $ && obj.is(v)) {
					index = i
				} else if(obj === v) index = i;
			});
			return index;
		},
		/**
		 * 模板字符串替换，变量用${v}表示
		 *
		 * @param      {string}  string     模板字符串
		 * @param      {array}  variables   字符串变量数组
		 * @return     {string}  The string.
		 */
		_getTplString = function(string, variables) {
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
			nodeId: 'id',
			nodeType: 'data-task-type',
			nodeLabel: 'data-task-label'
		},
		SELECTORS = {
			item: '.workflow',
			itemLabel: '.workflow-content>p',
			itemStart: '.start',
			itemEnd: '.end',
			itemStartEnd: '.workflow.start,.workflow.end',
			lineWrap: '.workflow-line-wrap',
			presetStage: '.workflow-preset-stage',
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
			'<div class="workflow" data-task-type="${type}" id="${uid}">',
			'	<div class="workflow-content">',
			'		<span class="btn-close" data-dissmiss="workflow"><i class="icon icon-reset"></i></span>',
			'		<div class="workflow-img"><i class="icon workflow-icon"></i></div>',
			'		<p class="label">${label}</p>',
			'	</div>',
			'	<div class="workflow-footer">',
			'		<i class="workflow-pointer icon icon-pointer"></i>',
			'	</div>',
			'</div>'
		].join('');
	return {
		options: {
			draggableSelector: '[data-dragtype="workflow"]',
			//节点拖拽的触发点选择器
			draghandle: '.workflow-content',
			//连线箭头大小
			arrowSize: 8,
			uidPrefix: '',
			childrenField: 'following',
			onCreateNode: $.noop,
			//params [source, target, error]
			onIllegallyLine: $.noop,
			/**
			 * 针对每个节点的是否允许拖放的回掉
			 * @param {Object} e drop事件
			 * @param {Object} $el 对应生成节点
			 * @param {Object} $source 拖拽源节点
			 */
			enableDrop: function(e, $el, $source) {
				return true;
			},
			/**
			 * 序列化回调，用于在getData()中自定义数据
			 * @param {Object} $node
			 * @param {Object} datai
			 */
			onSerialize:function($node,datai){
				return datai;
			},
			/**
			 * 反序列化回调
			 * @param {Object} $node
			 * @param {Object} datai
			 */
			onDeserialize:function($node,datai){
				return $node;
			},
			//允许回流
			enableLineBack: false
		},

		_create: function() {
			SUPER._create.call(this);
			
			this.$branchingLine = _createNS('svg', {
					class: [CLASSES.lineWrap, CLASSES.presetStage].join(' '),
					'pointer-events': 'none'
				})
				.append(_createNS('path').attr({
					class: [CLASSES.line, CLASSES.preset].join(' ')
				}))
				.appendTo(this.element);
		},

		_init: function() {						
			var _this = this;
			this.element.find(SELECTORS.itemStartEnd).each(function() {
				var $this = $(this),
					uid = _getUID(_this.options.uidPrefix);

				$this.attr(ATTRS.nodeId, uid)
					.data(_this._getInitDataKeys())
					.draggabilly({
						handle: _this.options.draghandle
					})
					.on('dragMove', $.proxy(_this._handleDragItem, _this));

				if($this.is(SELECTORS.itemStart)) _this.$origin = $this;
				if($this.is(SELECTORS.itemEnd)) _this.$terminal = $this;
			});

			if(!this.$origin || !this.$terminal) throw new Error('The start node and the end node shoud be preseted!');
			this._bindEvents();
			return this;
		},
		_bindEvents: function() {
			var _this = this;
			this.document.on('dragstart', this.options.draggableSelector, function(e) {

				var $this = $(e.target);

				if(!$this.attr('id')) $this.attr('id', _getUID('draggable-'));

				e = e.originalEvent;
				e.dataTransfer.setData("Text", $this.attr('id'));
			});

			this._on(this.element, {
				'dragover': '_handleDragover',
				'drop': '_handleDrop',
				'mousedown .workflow-pointer': '_handleBranchMousedown',			
				'scroll': '_handleScroll',
				'click .workflow-line': '_handleLineClick',
				'click [data-dissmiss="workflow"]': '_handleItemDissmiss'
			});
			this._on(this.document,{
				'mousemove': '_handleBranchMousemove',
				'mouseup': '_handleBranchMouseup',
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
				offset = this.element.offset(),
				$target = $(document.getElementById(e.originalEvent.dataTransfer.getData("Text")));
			//防止其他结构意外拖入
			if(!$target.is(this.options.draggableSelector)) {
				return false;
			}

			var newItem = this._createNode($target.attr(ATTRS.nodeType), _getUID(this.options.uidPrefix), $target.attr(ATTRS.nodeLabel) || $target.text())
				.css({
					position: 'absolute',
					left: originalE.pageX - offset.left,
					top: originalE.pageY - offset.top
				});
			//回调函数，是否允许drop
			if(!this.options.enableDrop.call(this, e, newItem, $target)) {
				return false;
			}

			return this;
		},
		_handleItemDissmiss: function(e) {
			var $item = $(e.target).closest(SELECTORS.item);

			this.deleteNode($item);
		},
		_handleBranchMousedown: function(e) {
			var
				originalE = e.originalEvent,
				offset = this.element.offset();

			e.stopPropagation();
			e.preventDefault();

			this.$brachingStart = $(e.target).closest(SELECTORS.item);

			if(this.$brachingStart.is(SELECTORS.itemEnd)) return false;
			this.branching = true;
			this.brachingStart = [originalE.pageX - offset.left, originalE.pageY - offset.top];
		},
		_handleBranchMousemove: function(e) {
			if(!this.branching) return;

			this.drawBranch = false;
			e.stopPropagation();
			e.preventDefault();

			var
				originalE = e.originalEvent,
				offset = this.element.offset(),
				cx = originalE.pageX - offset.left,
				cy = originalE.pageY - offset.top,
				$target = $(e.target).closest(SELECTORS.item);

			this._clearPreset();

			if($target.length && !$target.is(this.$brachingStart)) {
				this.element.append(this.$presetLine = this._createLine(this.$brachingStart, $target)
					.data(DATA.lineFrom, this.$brachingStart).data(DATA.lineTo, $target));
				this.drawBranch = true;
			} else {
				this.$branchingLine.find(SELECTORS.line).attr({
					d: this._getLinePath(this.brachingStart, [cx, cy])
				});
			}
		},

		_handleBranchMouseup: function(e) {
			if(!this.branching) return;

			this.branching = false;

			(this.drawBranch && this.$presetLine) && this.addLine(this.$presetLine.clone(true).attr('class', CLASSES.lineWrap));

			this._clearPreset();
		},

		_handleLineClick: function(e) {
			this.deleteLine($(e.target).closest(SELECTORS.lineWrap));
		},
		_handleScroll: function(e) {
			this._adaptBranchStage();
		},
		_handleDragItem: function(e, pointer, moveVector) {
			this.repaintLines($(e.currentTarget))._adaptBranchStage();
		},
		_adaptBranchStage:function(){
			this.$branchingLine.css({
				left: this.element.scrollLeft(),
				top: this.element.scrollTop()
			});
		},
		/**
		 * 根据起点和终点坐标获取连线路径
		 * @param {Object} startP
		 * @param {Object} endP
		 * @param {Object} isVertical
		 */
		_getLinePath: function(startP, endP, type) {
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

			if(type === 'top' || type === 'bottom') {
				return [
					'M', startP.join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiff].join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiffW].join(','),
					'L', arrowPointLeft.join(','), 'L', endP.join(','), 'L', arrowPointRight.join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiffW].join(','), 'L', [endP[0], endP[1] - symbolY * arrowDiff].join(',')
				].join(' ');
			} else {
				return [
					'M', startP.join(','), 'L', [endP[0] - symbolX * arrowDiff, endP[1]].join(','), 'L', [endP[0] - symbolX * arrowDiffW, endP[1]].join(','),
					'L', arrowPointTop.join(','), 'L', endP.join(','), 'L', arrowPointBottom.join(','), 'L', [endP[0] - symbolX * arrowDiffW, endP[1]].join(','), 'L', [endP[0] - symbolX * arrowDiff, endP[1]].join(',')
				].join(' ');
			}
		},
		/**
		 * 根据起点和终点dom节点获取连线路径
		 * @param {Object} $source
		 * @param {Object} $target
		 */
		_getLinePathFromEle: function($source, $target) {
			var
				start_x = $source.position().left,
				start_y = $source.position().top,
				end_x = $target.position().left,
				end_y = $target.position().top,
				//左侧节点
				L = start_x > end_x ? $target : $source,
				//上侧节点
				T = start_y > end_y ? $target : $source,
				centerX = (Math.abs(end_x - start_x) - L.width()) / 2 + L.width(),
				centerY = (Math.abs(end_y - start_y) - T.height()) / 2 + T.height(),
				xMin = Math.min(start_x, end_x),
				yMin = Math.min(start_y, end_y),
				arrowSize = this.options.arrowSize;

			var
				lineStart = this._getClosestAnchor(this._getNodePoints($source, xMin, yMin), centerX, centerY),
				lineEnd = this._getClosestAnchor(this._getNodePoints($target, xMin, yMin), centerX, centerY);

			return {
				//线条path值 d
				path: this._getLinePath(lineStart.point, lineEnd.point, lineEnd.type),
				//线条位置样式
				wrapCss: {
					width: Math.max(lineStart.point[0], lineEnd.point[0]) + arrowSize,
					height: Math.max(lineStart.point[1], lineEnd.point[1]) + arrowSize,
					left: xMin + this.element.scrollLeft(),
					top: yMin + this.element.scrollTop()
				}
			}
		},
		/**
		 * 获取最近的连线点
		 * @param {Object} anchors
		 * @param {Object} centerX
		 * @param {Object} centerY
		 */
		_getClosestAnchor: function(anchors, centerX, centerY) {
			var
				minDis = Infinity,
				anchor = {};

			$.each(anchors, function(i, v) {
				var dis = Math.pow(v[0] - centerX, 2) + Math.pow(v[1] - centerY, 2);
				if(dis < minDis) {
					minDis = dis;
					anchor.point = v;
					anchor.type = i;
				}
			});

			return anchor;
		},
		/**
		 * 根据节点获取节点上四个方向的连线点
		 * @param {Object} $node
		 * @param {Object} O 起点
		 */
		_getNodePoints: function($node, ox, oy) {
			var
				//计算位置要加上容器滚动条距离
				offset = $node.position(),
				offset_x = offset.left,
				offset_y = offset.top,
				width = $node.width(),
				height = $node.height();

			return {
				top: [offset_x - ox + width / 2, offset_y - oy],
				bottom: [offset_x - ox + width / 2, offset_y - oy + height],
				left: [offset_x - ox, offset_y - oy + height / 2],
				right: [offset_x - ox + width, offset_y - oy + height / 2]
			};

		},
		/**
		 * 
		 * @param {Object} $source
		 * @param {Object} $target
		 */
		_createLine: function($source, $target) {
			var linePath = this._getLinePathFromEle($source, $target);

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
		_createNode: function() {
			var $node = $(_getTplString(TEMPLATE, arguments)).clone()
				.data(this._getInitDataKeys())
				.draggabilly({
					handle: this.options.draghandle
				})
				.on('dragMove', $.proxy(this._handleDragItem, this))
				.appendTo(this.element);
			this.options.onCreateNode.call(this, $node);
			return $node;
		},
		_clearPreset: function() {
			this.$presetLine && this.$presetLine.remove();
			this.$branchingLine.find(SELECTORS.line).attr({
				d: ''
			});
		},
		/**
		 * 遍历连线数组，然后删除
		 * @param {Array} lines
		 */
		_deleteLines: function(lines) {
			if(!$.isArray(lines)) return;

			var
				_this = this,
				//这里必须提前拷贝，否则deleteLine()方法会改变lines数组
				linesCopy = lines.slice();
			$.each(linesCopy, function(i, v) {
				_this.deleteLine($(v));
			});
		},
		/**
		 * 检测回流,即出现连线闭合回路
		 * @param {Object} $source 起点
		 * @param {Object} $target 终点
		 * @return {Boolean} flag true表示出现回流
		 */
		_checkBackFlow: function($source, $target) {
			var
				_this = this,
				flag = false;

			if($target.is(SELECTORS.itemEnd)) return false;
			if(~_inArray($source, $target.data(DATA.toNodes))) return true;

			$.each($target.data(DATA.toNodes), function(i, v) {
				var $child = $(v);

				if(~_inArray($source, $child)) return flag = true;
				flag = _this._checkBackFlow($source, $child);
			});

			return flag;
		},
		/**
		 * 添加连线 只传一个参数则表示连线$line
		 * @param {Object} $source 开始节点/预置连线
		 * @param {Object} $target  结束节点,可选
		 */
		addLine: function($source, $target) {
			var $presetLine;
			if($source.is(SELECTORS.lineWrap)) {
				$presetLine = $source;
				$source = $presetLine.data(DATA.lineFrom);
				$target = $presetLine.data(DATA.lineTo);
			} else {
				$presetLine = this._createLine($source, $target).data(DATA.lineFrom, $source).data(DATA.lineTo, $target);
			}
			//连线到起点
			if($target.is(SELECTORS.itemStart)) return this.options.onIllegallyLine.call(this, $source, $target, {
				type: 'lineToRoot'
			});
			//重复连线
			if(~_inArray($target, $source.data(DATA.toNodes))) return this.options.onIllegallyLine.call(this, $source, $target, {
				type: 'lineRepetition'
			});
			//检测回流
			if(!this.options.enableLineBack && this._checkBackFlow($source, $target)) return this.options.onIllegallyLine.call(this, $source, $target, {
				type: 'lineBackFlow'
			});

			this.element.append($presetLine);
			$source.data(DATA.fromLines).push($presetLine);
			$source.data(DATA.toNodes).push($target);
			$target.data(DATA.toLines).push($presetLine);
			$target.data(DATA.fromNodes).push($source);

			return this;
		},
		/**
		 * 删除连线,同时清空节点上的该条连线数据,删除节点间的关联
		 * @param {Object} $line
		 */
		deleteLine: function($line) {
			if(!$line instanceof $) return;

			var
				f_node = $line.data(DATA.lineFrom),
				t_node = $line.data(DATA.lineTo),
				f_lines = f_node && f_node.data(DATA.fromLines),
				t_lines = t_node && t_node.data(DATA.toLines),
				f_t_nodes = f_node && f_node.data(DATA.toNodes),
				t_f_nodes = t_node && t_node.data(DATA.fromNodes);

			$.isArray(f_lines) && f_lines.splice(_inArray($line, f_lines), 1);
			$.isArray(t_lines) && t_lines.splice(_inArray($line, t_lines), 1);
			$.isArray(t_f_nodes) && t_f_nodes.splice(_inArray(f_node, t_f_nodes), 1);
			$.isArray(f_t_nodes) && f_t_nodes.splice(_inArray(t_node, f_t_nodes), 1);

			$line.remove();

			return this;
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

			return this;
		},
		/**
		 * 根据节点重绘线条
		 * @param {Object} $node 节点
		 */
		repaintLines: function($node) {
			var _this = this;
			//遍历节点相关连线 ,重新绘制
			$.each($node.data(DATA.fromLines).concat($node.data(DATA.toLines)), function(i, v) {
				var
					$line = $(v),
					linePath = _this._getLinePathFromEle($line.data(DATA.lineFrom), $line.data(DATA.lineTo));

				$line.css(linePath.wrapCss).find(SELECTORS.line).attr('d', linePath.path);
			});

			return this;
		},
		/**
		 * 重绘所有线条
		 * 
		 */
		repaintAllLines: function() {
			var _this = this;

			this.element.find(SELECTORS.item).each(function() {
				_this.repaintLines($(this));
			});

			return this;
		},
		/**
		 * 序列化
		 */
		getData: function() {
			var
				_this = this,
				_getNode = function($node) {
					var nodeData = {
						uid: $node.attr(ATTRS.nodeId),
						type: $node.attr(ATTRS.nodeType),
						label: $node.find(SELECTORS.itemLabel).text(),
						pos: [$node.position().left, $node.position().top]
					};
					nodeData = _this.options.onSerialize.call(this,$node,nodeData);
					if($node.data(DATA.toNodes).length && !$node.is(SELECTORS.itemEnd)) {
						nodeData[_this.options.childrenField] = $.map($node.data(DATA.toNodes), function(e, i) {
							return _getNode(e);
						});
					}					
					return nodeData;
				};
			return _getNode(this.$origin);
		},
		/**
		 * 反序列化
		 * @param {Object} data
		 */
		recover: function(data) {
			//清空其他结构
			this.element.children().not([SELECTORS.itemStartEnd, SELECTORS.presetStage].join(',')).remove();
			if(!data) return;
			var
				_this = this,
				childrenField = _this.options.childrenField,
				_recoverNode = function(datai, $prevNode) {
					$.each(datai, function(i, v) {
						var
							$searcher = $('#' + v.uid),
							$newNode = $searcher.length ? $searcher :
							v.type === 'end' ? _this.$terminal :
							_this._createNode(v.type, v.uid, v.label);

						$newNode.css({
							position: 'absolute',
							left: v.pos[0],
							top: v.pos[1]
						});
						$newNode = _this.options.onDeserialize.call(this,$newNode,v);
						//过滤重复连线
						if(!~_inArray($newNode, $prevNode.data(DATA.toNodes))) {
							_this.addLine($prevNode, $newNode)
						}
						if(v[childrenField]) {
							_recoverNode(v[childrenField], $newNode);
						}					
					});
				};

			_recoverNode(data[childrenField], this.$origin.css({
				position: 'absolute',
				left: data.pos[0],
				top: data.pos[1]
			}));
			return this;
		}
	};
});
