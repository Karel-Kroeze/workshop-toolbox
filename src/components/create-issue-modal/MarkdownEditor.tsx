import './MarkdownEditor.scss';

import React, { Component } from 'react';

import { markdown } from '../../content';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
}

interface MarkdownEditorState {
    preview: boolean;
}

export class MarkDownEditor extends Component<
    MarkdownEditorProps,
    MarkdownEditorState
> {
    state: MarkdownEditorState = {
        preview: false,
    };

    togglePreview = (): void => {
        this.setState({ preview: !this.state.preview });
    };

    render() {
        const { value, onChange } = this.props;
        const { preview } = this.state;

        return (
            <div className="markdown-editor">
                <div className="tabs is-boxed">
                    <ul>
                        <li className={preview ? "" : "is-active"}>
                            <a onClick={this.togglePreview}>Write</a>
                        </li>
                        <li className={preview ? "is-active" : ""}>
                            <a onClick={this.togglePreview}>Preview</a>
                        </li>
                    </ul>
                </div>
                {!preview && (
                    <textarea
                        className="textarea"
                        onChange={(ev) => onChange(ev.target.value)}
                        rows={10}
                        value={value}
                    />
                )}
                {preview && (
                    <div
                        className="preview"
                        dangerouslySetInnerHTML={{
                            __html: markdown.makeHtml(value),
                        }}
                    ></div>
                )}
            </div>
        );
    }
}
