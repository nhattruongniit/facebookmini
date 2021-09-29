import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NO_AVARTAR, PF } from '../../constants';
import { AuthContext } from '../../context/AuthProvider';

import StoryViewer from './components/StoryViewer';

import { useParams } from 'react-router-dom';
import { sortDateUtils } from '../../utils/utils';

StoryDetail.propTypes = {};

// code ngu, khong ngoi phan tich tu dau, gio tach component kho !!!!!!!!!!!!!!
function StoryDetail(props) {
    const { user: currentUser } = useContext(AuthContext);
    const [stories, setStories] = useState(); /* total story */

    /* index of storyUser: [story1, story2, story3]*/
    const [showStoryIndex, setShowStoryIndex] = useState(0);
    const [followingUsers, setFollowingUsers] = useState([]);
    const [storyViewer, setStoryViewer] = useState([]); /*story will show inside class right */
    const [storyAuthor, setStoryAuthor] = useState({});
    const [allUser, setAllUser] = useState([]);
    const storyTimeOutRef = useRef(null);
    const pauseFlagMouse = useRef(false); /*flag of mouse event */

    /*flag of btn pause */
    // const [pauseState, setPauseState] = useState(false); will re-render if use state in this case
    const pauseFlagBtn = useRef(false);

    const { storyId } = useParams();

    // get stories and get user from stories

    useEffect(() => {
        try {
            (async () => {
                // get stories
                const storiesRes = await axios.get(`/stories/${currentUser._id}`);

                setStories(storiesRes.data);

                const tempArray = []; /*following story */
                let userId;

                sortDateUtils(storiesRes.data).forEach((storyUser) => {
                    if (storyUser.some((aStoryUser) => aStoryUser._id === storyId)) {
                        setStoryViewer(sortDateUtils(storyUser));
                        userId = storyUser[0].userId;
                    }

                    if (storyUser[0].userId !== currentUser._id) {
                        tempArray.push(storyUser);
                    }
                });

                // get author from story viewer
                const authorRes = await axios.get(`/users?userId=${userId}`);
                setStoryAuthor(authorRes.data);

                // get following user from stories
                console.log(tempArray);
                const followingUserIds = tempArray.map(
                    (followingStory) => followingStory[0].userId
                );

                const followingUsersRes = await axios.put('/users/list', {
                    /*get method ko co body*/ userIds: followingUserIds,
                });
                setFollowingUsers(followingUsersRes.data);
                setAllUser([currentUser, ...followingUsersRes.data]);
            })();
        } catch (error) {
            console.log(error);
        }
    }, [currentUser, storyId]);

    // debounce with ref
    useEffect(() => {
        // console.log('fla', pauseFlagMouse.current);
        if (storyViewer.length > 0) {
            let time = 0;
            storyTimeOutRef.current = setInterval(() => {
                // console.log(time);
                if (!pauseFlagMouse.current) {
                    time++;
                    if (time === 5) {
                        time = 0;
                        changeStoryIndexHandler(1);
                    }
                }
            }, 1000);
        }

        return () => {
            clearInterval(storyTimeOutRef.current);
        };
    });

    const changeStoryViewerHandler = (user) => {
        // get story by userId field

        const sViewer = stories.filter((storyUser) => storyUser[0].userId === user._id);
        setStoryViewer(...sViewer);
        setStoryAuthor(user);
        setShowStoryIndex(0);

        document.getElementById('storyNextBtn').classList.remove('hidden');
        document.getElementById('storyPrevBtn').classList.remove('hidden');

        if (user._id === currentUser._id) {
            document.getElementById('storyPrevBtn').classList.add('hidden');
        }
        pauseFlagMouse.current = false;
        pauseFlagBtn.current = false;
    };

    const changeStoryIndexHandler = (number) => {
        document.getElementById('storyNextBtn').classList.remove('hidden');
        document.getElementById('storyPrevBtn').classList.remove('hidden');

        if (showStoryIndex + number >= storyViewer.length || showStoryIndex + number < 0) {
            console.log('change story view');

            const currentIndex = allUser.findIndex((user) => user._id === storyAuthor._id);
            const temStoryAuthor = allUser[currentIndex + number];
            setStoryAuthor(temStoryAuthor);

            const sViewer = stories.filter(
                (storyUser) => storyUser[0].userId === allUser[currentIndex + number]._id
            );

            setStoryViewer(...sViewer);
            setShowStoryIndex(0);

            // disable storyPrevBtn
            // click btn when change view
            if (temStoryAuthor._id === currentUser._id && showStoryIndex === 0) {
                document.getElementById('storyPrevBtn').classList.add('hidden');
            }
        } else {
            setShowStoryIndex(showStoryIndex + number);
        }

        if (
            storyAuthor._id === allUser[allUser.length - 1]._id &&
            showStoryIndex + number === storyViewer.length - 1
        ) {
            console.log('last');
            document.getElementById('storyNextBtn').classList.add('hidden');
        }

        // click btn prev in this story
        if (storyAuthor._id === currentUser._id && showStoryIndex + number === 0) {
            document.getElementById('storyPrevBtn').classList.add('hidden');
        }
    };

    // console.log('render');
    return (
        <div className="stories">
            <div className="left">
                <div className="storyLeftTop">
                    <div className="storyLeftTopTitle">Tin</div>
                </div>
                <div className="storySubTitle">Tin của bạn</div>
                <div
                    className={
                        storyAuthor._id === currentUser._id ? 'storyUser active' : 'storyUser'
                    }
                    onClick={() => changeStoryViewerHandler(currentUser)}
                >
                    <div className="storyUserInfo">
                        <img
                            src={`${PF}/${
                                currentUser.avatar ? `person/${currentUser.avatar}` : NO_AVARTAR
                            }`}
                            alt=""
                            className="storyUserInfoAvatar"
                        />
                        <div className="storyUserInfoText">
                            <div className="storyUserInfoTextUsername">{`${currentUser.firstName} ${currentUser.lastName}`}</div>
                            <div className="storyUserInfoTextTime">7 phút</div>
                        </div>
                    </div>
                    <Link to="/stories/create" className="storyUserBtnLink">
                        <div className="storyUserBtn">+</div>
                    </Link>
                </div>
                <div className="storySubTitle">Tất cả tin</div>
                <ul className="storyUserList">
                    {followingUsers.map((followingUser) => (
                        <li
                            key={followingUser._id}
                            className={
                                storyAuthor._id === followingUser._id
                                    ? 'storyUser active'
                                    : 'storyUser'
                            }
                            onClick={() => changeStoryViewerHandler(followingUser)}
                        >
                            <div className="storyUserInfo">
                                <img
                                    src={`${PF}/${
                                        followingUser.avatar
                                            ? `person/${followingUser.avatar}`
                                            : NO_AVARTAR
                                    }`}
                                    alt=""
                                    className="storyUserInfoAvatar"
                                />
                                <div className="storyUserInfoText">
                                    <div className="storyUserInfoTextUsername">{`${followingUser.firstName} ${followingUser.lastName}`}</div>
                                    <div className="storyUserInfoTextTime">7 phút</div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="right">
                <StoryViewer
                    storyViewer={storyViewer}
                    showStoryIndex={showStoryIndex}
                    pauseFlagBtn={pauseFlagBtn}
                    pauseFlagMouse={pauseFlagMouse}
                    storyAuthor={storyAuthor}
                    changeStoryIndex={changeStoryIndexHandler}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
}

export default StoryDetail;