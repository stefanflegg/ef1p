import { Color } from '../../utility/color';

import { Box } from '../utility/box';
import { Point } from '../utility/point';

export const indentation = '    ';

export interface Collector {
    theme: 'light' | 'dark';
    elements: Set<string>;
    classes: Set<string>;
    circles: Set<Color | undefined>;
    arrows: Set<Color | undefined>;
}

function createEmptyCollector(): Collector {
    return {
        theme: 'light',
        elements: new Set(),
        classes: new Set(),
        circles: new Set(),
        arrows: new Set(),
    };
}

// Element

export abstract class Element<P = object> {
    public constructor(public readonly props: Readonly<P>) {}

    protected abstract _encode(collector: Collector, prefix: string, props: Readonly<P>): string;

    public encode(collector: Collector, prefix: string): string {
        return this._encode(collector, prefix, this.props);
    }

    public toString(): string {
        return this.encode(createEmptyCollector(), '');
    }
}

// AnimationElement

export abstract class AnimationElement<P = {}> extends Element<P> {}

// ElementWithChildren

export interface ElementWithChildrenProps<C extends Element> {
    id?: string;
    color?: Color;
    style?: string;
    classes?: string[];
    transform?: string;
    children?: C[];
}

export abstract class ElementWithChildren<C extends Element, P extends ElementWithChildrenProps<C>> extends Element<P> {
    protected abstract _boundingBox(props: Readonly<P>): Box;

    public boundingBox(): Box {
        return this._boundingBox(this.props);
    }

    protected attributes(collector: Collector): string {
        const props = this.props;
        let classes: string[] = props.classes ?? [];
        const color: Color | undefined = props.color;
        if (color) {
            classes = [color, ...classes]; // classes.unshift(color) would modify the property itself.
        }
        classes.forEach(className => collector.classes.add(className));
        return (props.id ? ` id="${props.id}"` : '')
            + (props.style ? ` style="${props.style}"` : '')
            + (classes.length > 0 ? ` class="${classes.join(' ')}"` : '')
            + (props.transform ? ` transform="${props.transform}"` : '');
    }

    protected children(collector: Collector, prefix: string): string {
        const children = this.props.children;
        let result = '';
        if (children) {
            result += '\n';
            children.forEach(child => result += child.encode(collector, prefix + indentation));
            result += prefix;
        }
        return result;
    }
}

// VisualElement

export interface VisualElementProps extends ElementWithChildrenProps<AnimationElement> {}

export abstract class VisualElement<P extends VisualElementProps = VisualElementProps> extends ElementWithChildren<AnimationElement, P> {
    public center(): Point {
        return this.boundingBox().center();
    }
}

// StructuralElement

export interface StructuralElementProps extends ElementWithChildrenProps<ElementWithChildren<any, any>> {
    children: ElementWithChildren<any, any>[];
}

export abstract class StructuralElement<P extends StructuralElementProps> extends ElementWithChildren<ElementWithChildren<any, any>, P> {
    public constructor(props: Readonly<P>) {
        super(props);

        if (props.children.length === 0) {
            throw Error(`A structural element has to have children.`);
        }
    }

    protected _boundingBox({ children }: P): Box {
        let boundingBox = children[0].boundingBox();
        for (let i = 1; i < children.length; i++) {
            boundingBox = children[i].boundingBox().encompass(boundingBox);
        }
        return boundingBox;
    }
}
