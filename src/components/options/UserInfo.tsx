import { Component } from "react";

import { IGithubUser } from "../../utils/types";

interface UserInfoProps {
    user: IGithubUser;
}

export default class UserInfo extends Component<UserInfoProps> {
    render() {
        const { user, avatar } = this.props.user;

        return (
            <div className="user-details">
                {avatar && <img src={avatar} alt="avatar" className="avatar" />}
                <div className="name">{user}</div>
            </div>
        );
    }
}
