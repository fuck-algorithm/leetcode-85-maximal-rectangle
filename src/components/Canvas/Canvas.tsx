import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { AlgorithmStep } from '../../types';
import { StackVisualization } from './StackVisualization';
import { AnnotationsLayer } from './AnnotationsLayer';
import styles from './Canvas.module.css';

interface CanvasProps {
  heights: number[];
  currentStep: AlgorithmStep | null;
  totalSteps: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function Canvas({ heights, currentStep, totalSteps }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canvasFrame, setCanvasFrame] = useState(0);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion || !currentStep) return;
    const timer = window.setTimeout(() => {
      setCanvasFrame(currentStep.id + 1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentStep, reducedMotion]);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 绑定拖拽和缩放
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          scale: event.transform.k,
        });
      });

    d3.select(svg).call(zoom);

    return () => {
      d3.select(svg).on('.zoom', null);
    };
  }, []);

  // 重置视图
  const resetView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    d3.select(svg)
      .transition()
      .duration(reducedMotion ? 0 : 300)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
    setTransform({ x: 0, y: 0, scale: 1 });
  }, [reducedMotion]);

  // 计算布局参数
  const margin = { top: 60, right: 40, bottom: 120, left: 40 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;

  const maxHeight = Math.max(...heights, 1);
  const barWidth = Math.min(60, (chartWidth - (heights.length - 1) * 4) / heights.length);
  const totalBarsWidth = heights.length * barWidth + (heights.length - 1) * 4;
  const startX = (chartWidth - totalBarsWidth) / 2;

  const yScale = d3.scaleLinear()
    .domain([0, maxHeight])
    .range([chartHeight, 0]);

  // 柱子中心 x 坐标（供指针与标注复用）
  const barCenterX = (barIndex: number) => startX + barIndex * (barWidth + 4) + barWidth / 2;

  // 获取柱子颜色
  const getBarColor = (index: number): string => {
    if (!currentStep) return '#d9e7e2';

    if (currentStep.highlightRect) {
      const { left, right } = currentStep.highlightRect;
      if (index >= left && index <= right) {
        return '#18765a';
      }
    }

    if (currentStep.highlightBars.includes(index)) {
      return currentStep.currentIndex === index ? '#2f9e7d' : '#e8b04b';
    }

    if (currentStep.stack.some(s => s.index === index)) {
      return '#9ad3c2';
    }

    return '#91caff';
  };

  // 箭头标注的主色（用于 marker，取第一个 arrow 的颜色，否则默认灰）
  const arrowColor = currentStep?.annotations.find(a => a.type === 'arrow')?.color || '#666';

  return (
    <div className={styles.container} ref={containerRef} data-testid="visualization-canvas">
      <div className={styles.teachingLayer} aria-live="polite">
        <div className={styles.teachingHeader}>
          <span className={styles.stepTitle}>Step {currentStep ? currentStep.id + 1 : 1}/{totalSteps} · 步骤 {currentStep ? currentStep.id + 1 : 1}</span>
          <span className={styles.operationBadge} data-testid="operation-badge" data-operation={currentStep?.operation ?? 'init'}>
            {currentStep?.operation ?? 'init'}
          </span>
        </div>
        <p className={styles.narration} data-testid="step-narration">
          {currentStep?.narration ?? '读取柱状图并开始寻找最大矩形。'}
        </p>
        <div className={styles.legend} aria-label="状态图例" data-testid="canvas-legend">
          <span><i className={styles.currentKey} />当前柱</span>
          <span><i className={styles.compareKey} />比较/候选</span>
          <span><i className={styles.visitedKey} />已确认</span>
          <span><i className={styles.idleKey} />未处理</span>
        </div>
      </div>
      <div className={styles.toolbar}>
        <button className={styles.resetBtn} onClick={resetView}>
          重置视图
        </button>
        <span className={styles.hint}>拖拽平移 · 滚轮缩放</span>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
        data-testid="canvas-svg"
        data-frame={canvasFrame}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
          </marker>
        </defs>
        <g transform={`translate(${transform.x + margin.left}, ${transform.y + margin.top}) scale(${transform.scale})`}>
          {/* 柱状图 */}
          {heights.map((height, index) => {
            const x = startX + index * (barWidth + 4);
            const y = yScale(height);
            const barHeight = chartHeight - y;
            const color = getBarColor(index);

            return (
              <g key={index}>
                <rect
                  data-node-id={`bar-${index}`}
                  data-status={currentStep && (currentStep.currentIndex >= 0 ? currentStep.currentIndex : currentStep.highlightBars[0] ?? 0) === index ? 'current' : currentStep?.highlightBars.includes(index) ? 'compare' : currentStep?.stack.some(item => item.index === index) ? 'visited' : 'idle'}
                  className="canvas-node"
                  data-animate={currentStep && canvasFrame === currentStep.id + 1 ? 'true' : 'false'}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  style={{ transition: reducedMotion ? 'none' : 'fill 240ms ease, x 360ms ease, y 360ms ease, height 360ms ease' }}
                  stroke="#fff"
                  strokeWidth={1}
                  rx={2}
                />
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize={12} fill="#333">{height}</text>
                <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" fontSize={11} fill="#666">{index}</text>
                {currentStep && currentStep.leftBoundary[index] !== undefined && (
                  <text x={x + barWidth / 2} y={chartHeight + 36} textAnchor="middle" fontSize={10} fill="#faad14">L:{currentStep.leftBoundary[index]}</text>
                )}
                {currentStep && currentStep.rightBoundary[index] !== undefined && currentStep.rightBoundary[index] !== heights.length && (
                  <text x={x + barWidth / 2} y={chartHeight + 50} textAnchor="middle" fontSize={10} fill="#52c41a">R:{currentStep.rightBoundary[index]}</text>
                )}
              </g>
            );
          })}

          {/* 高亮矩形区域 */}
          {currentStep?.highlightRect && (
            <rect
              x={startX + currentStep.highlightRect.left * (barWidth + 4)}
              y={yScale(currentStep.highlightRect.height)}
              width={(currentStep.highlightRect.right - currentStep.highlightRect.left + 1) * (barWidth + 4) - 4}
              height={chartHeight - yScale(currentStep.highlightRect.height)}
              fill="rgba(82, 196, 26, 0.2)"
              stroke="#52c41a"
              strokeWidth={2}
              strokeDasharray="4,2"
            />
          )}

          {/* 当前指针 */}
          {currentStep && currentStep.currentIndex >= 0 && currentStep.currentIndex < heights.length && (
            <g>
              <polygon
                points={`${barCenterX(currentStep.currentIndex) - 8},${chartHeight + 65} ${barCenterX(currentStep.currentIndex) + 8},${chartHeight + 65} ${barCenterX(currentStep.currentIndex)},${chartHeight + 55}`}
                fill="#ff4d4f"
              />
              <text x={barCenterX(currentStep.currentIndex)} y={chartHeight + 80} textAnchor="middle" fontSize={11} fill="#ff4d4f" fontWeight="bold">i</text>
            </g>
          )}

          {/* 标注层：带方向的箭头、示意线、文字 */}
          {currentStep && (
            <AnnotationsLayer
              annotations={currentStep.annotations}
              toY={(h) => yScale(h)}
              barCenterX={barCenterX}
            />
          )}
        </g>
      </svg>

      <StackVisualization stack={currentStep?.stack || []} />
      <span className={styles.inputEcho} data-testid="canvas-input-echo">heights = [{heights.join(', ')}]</span>

      {currentStep?.currentArea !== undefined && (
        <div className={styles.areaDisplay}>
          当前面积: <span className={styles.areaValue}>{currentStep.currentArea}</span>
          {currentStep.maxArea > 0 && (
            <>
              {' '}| 最大面积: <span className={styles.maxAreaValue}>{currentStep.maxArea}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
