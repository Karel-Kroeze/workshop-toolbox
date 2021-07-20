import "./options.scss";
import "react-toastify/dist/ReactToastify.css";

import { render } from "react-dom";
import { ToastContainer } from "react-toastify";
import ReactTooltip from "react-tooltip";

import { ModList } from "./components/options/ModList";
import { QuickReplyOptions } from "./components/options/QuickReplies";
import { User } from "./components/options/User";
import { toastContainerStyles } from "./utils/toasts";

const Options = () => (
    <div className="container content">
        <div className="box">
            <User />
        </div>
        <div className="box">
            <ModList />
        </div>
        <div className="box">
            <QuickReplyOptions />
        </div>
        <ReactTooltip
            id="options-tooltip"
            type="light"
            effect="solid"
            html
            className="workshop-toolbox tooltip"
        />
        <ToastContainer css={toastContainerStyles} />
    </div>
);
render(<Options />, document.getElementById("options"));
