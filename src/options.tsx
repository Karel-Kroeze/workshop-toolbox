import './options.scss';
import 'toastify-js/src/toastify.css';

import React from 'react';
import { render } from 'react-dom';
import ReactTooltip from 'react-tooltip';

import { ModList } from './components/options/ModList';
import { QuickReplyOptions } from './components/options/QuickReplies';
import { User } from './components/options/User';

const Options = () => (
    <div className="container content">
        <ReactTooltip
            id="options-tooltip"
            type="light"
            effect="solid"
            html
            className="workshop-toolbox tooltip"
        />
        <div className="box">
            <User />
        </div>
        <div className="box">
            <ModList />
        </div>
        <div className="box">
            <QuickReplyOptions />
        </div>
    </div>
);
render(<Options />, document.getElementById("options"));
