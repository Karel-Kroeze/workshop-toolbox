import './DefaultRepoSetter.scss';

import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { RiStarFill, RiStarLine } from 'react-icons/ri';

import { IMod, IRepository } from '../../utils/types';

interface DefaultRepoIconProps {
    mod: IMod;
    repo?: IRepository;
    setDefault: (mod: IMod, repo: IRepository) => void;
}

export class DefaultRepoIcon extends Component<DefaultRepoIconProps> {
    get isDefault() {
        const { repo, mod } = this.props;
        return repo && mod.github && isEqual(mod.github, repo);
    }

    render() {
        const { mod, setDefault, repo } = this.props;
        return (
            <>
                {!this.isDefault && repo && (
                    <RiStarLine
                        fontSize="28px"
                        onClick={() => setDefault(mod, repo)}
                        className="default-repo-button"
                        title={`set as default for ${mod.name}`}
                    />
                )}
                {!this.isDefault && !repo && (
                    <RiStarLine
                        fontSize="28px"
                        className="default-repo-disabled"
                        title="no repo selected"
                    />
                )}
                {this.isDefault && (
                    <RiStarFill
                        fontSize="28px"
                        className="default-repo"
                        title={`this is the default repository for ${mod.name}`}
                    />
                )}
            </>
        );
    }
}
