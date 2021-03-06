import { Color } from '../../utility/color';

import { Box } from '../utility/box';
import { defaultCornerRadius, textMargin } from '../utility/constants';
import { Point } from '../utility/point';

import { Collector, VisualElement, VisualElementProps } from './element';
import { Line } from './line';
import { Text, TextLine, TextProps } from './text';

export interface RectangleProps extends VisualElementProps {
    position: Point;
    size: Point;
    cornerRadius?: number;
}

export class Rectangle extends VisualElement<RectangleProps> {
    public constructor(
        props: Readonly<RectangleProps>,
    ) {
        super(props);

        if (props.size.x < 0 || props.size.y < 0) {
            throw Error(`The size ${props.size.toString()} has to be positive.`);
        }
    }

    protected _boundingBox({ position, size }: RectangleProps): Box {
        return new Box(position, position.add(size));
    }

    protected _encode(collector: Collector, prefix: string, {
        position,
        size,
        cornerRadius = defaultCornerRadius,
    }: RectangleProps): string {
        position = position.round3();
        size = size.round3();
        collector.elements.add('rect');
        return prefix + `<rect${this.attributes(collector)}`
            + ` x="${position.x}" y="${position.y}"`
            + ` width="${size.x}" height="${size.y}"`
            + ` rx="${cornerRadius}" ry="${cornerRadius}">`
            + `${this.children(collector, prefix)}</rect>\n`;
    }

    public text(
        text: TextLine | TextLine[],
        props: Omit<TextProps, 'position' | 'text'> = {},
        margin: Point = textMargin,
    ): Text {
        let x: number;
        let y: number;
        const box = this.boundingBox();
        const center = box.center();
        const horizontalAlignment = props.horizontalAlignment ?? 'center';
        const verticalAlignment = props.verticalAlignment ?? 'center';
        switch (horizontalAlignment) {
            case 'left':
                x = box.topLeft.x + margin.x;
                break;
            case 'center':
                x = center.x;
                break;
            case 'right':
                x = box.bottomRight.x - margin.x;
                break;
        }
        switch (verticalAlignment) {
            case 'top':
                y = box.topLeft.y + margin.y;
                break;
            case 'center':
                y = center.y;
                break;
            case 'bottom':
                y = box.bottomRight.y - margin.y;
                break;
        }
        const position = new Point(x, y);
        const color = this.props.color;
        return new Text({ position, text, horizontalAlignment, verticalAlignment, color, ...props });
    }

    public cross(shorten: number = 0, color: Color | undefined = this.props.color): Line[] {
        const { position, size } = this.props;
        return [
            new Line({ start: position, end: position.add(size), color }).shorten(shorten),
            new Line({ start: position.addY(size.y), end: position.addX(size.x), color }).shorten(shorten),
        ]
    }
}
