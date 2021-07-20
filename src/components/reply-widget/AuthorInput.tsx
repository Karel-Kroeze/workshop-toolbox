export const AuthorInput = (props: {
    author: string;
    onChange: (author: string) => void;
}) => {
    return (
        <div className="help">
            @
            <span
                contentEditable
                suppressContentEditableWarning
                onInput={(ev) => props.onChange(ev.currentTarget.innerText)}
                tabIndex={2}
            >
                {props.author}
            </span>
            :
        </div>
    );
};
