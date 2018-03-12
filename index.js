import React, {PureComponent} from "react";
import PropTypes from 'prop-types';
import {
    View,
    Animated,
    PanResponder,
    Image,
    StyleSheet,
    Switch,
    Text,
    TouchableNativeFeedback,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Dimensions
} from 'react-native';

//import {ICONS, COLORS, SCREEN_HEIGHT, SCREEN_WIDTH} from "../../constants";

//SCREEN SIZES
const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const SCREEN_HORIZONTAL_CENTER = Math.floor(SCREEN_WIDTH / 2);

//COLORS
const BACKGROUND_COLOR = '#ffffff';

//WRAPPERS SIZES
const CONTAINER_WIDTH = Math.floor(SCREEN_WIDTH * 0.9);
const CONTAINER_HEIGHT = Math.floor(SCREEN_HEIGHT / 2);
const CONTAINER_BOX_HEIGHT = Math.floor(CONTAINER_HEIGHT / 2);
const OVERFLOW_HEIGHT = SCREEN_HEIGHT;
const OVERFLOW_WIDTH = CONTAINER_WIDTH;
const LEFT_GAP = Math.floor((SCREEN_WIDTH - CONTAINER_WIDTH) / 2);
const RESPONDING_BOX_HEIGHT = 50;
const BUTTON_WIDTH = 50;
const TOTAL_HEIGHT = CONTAINER_HEIGHT + OVERFLOW_HEIGHT + RESPONDING_BOX_HEIGHT;


//POSSIBLE MENU STATES (OPEN/CLOSE)
const CLOSED_STATE = {x: 0, y: -TOTAL_HEIGHT + RESPONDING_BOX_HEIGHT};
const OPEN_STATE = {x: 0, y: -TOTAL_HEIGHT + RESPONDING_BOX_HEIGHT + CONTAINER_HEIGHT};

//NUMBER OF ELEMENTS PER ROW/COLUMN
const MAX_SWITCHES_PER_ROW = 3;

//-----------------------------------------------------------------------------------

const SwitchBox = ({category, switches, switchesState, display, toggleFunction}) => {
    return (
        <View style={[styles.switchesContainer, {display: display}]}>
            {
                switches.map((swt, i) => {
                    return (
                        <SwitchButton
                            key={swt.label}
                            label={swt.label}
                            onValueChange={(val) => toggleFunction(category, i, val, swt.callback)}
                            value={switchesState[i]}/>
                    )
                })
            }
        </View>
    )
};

const CategoryButton = ({label, onPress, active, imgPaths}) => {
    const noNativeFeedback = Platform.OS === 'ios' || Platform.Version <= 20;
    const image = (<Image source={active ? imgPaths.active : imgPaths.default} style={styles.categoryImage}></Image>);
    return (
        <View style={styles.categoryContainer}
              key={label}>
            {
                noNativeFeedback ?
                    <TouchableOpacity onPress={() => onPress()}>
                        {image}
                    </TouchableOpacity>
                    :
                    <TouchableNativeFeedback onPress={() => onPress()}>
                        {image}
                    </TouchableNativeFeedback>
            }
            <Text>{`${label[0].toUpperCase().concat(label.slice(1))}`}</Text>
        </View>
    )
};

const SwitchButton = ({id, label, onValueChange, value}) => {
    return (
        <View key={id}
              style={styles.switchContainer}>
            <Switch
                onValueChange={onValueChange}
                value={value}
            />
            <Text>{label}</Text>
        </View>
    );
};

export default class SlideMenu extends PureComponent {

    constructor(props) {
        super(props);

        //initial menu state
        const initial_state = props.isOpen ? OPEN_STATE : CLOSED_STATE;

        this.state = {
            panValues: new Animated.ValueXY(
                initial_state
            ),
            switchesState: Object.entries(props.elements)
                .map(e => {
                    const newEl = {};
                    newEl[e[0]] = e[1].switches.map(() => false);
                    return newEl
                })
                .reduce((acc, el) => Object.assign(acc, el)),
            activeSwitchesBox: ''
        };

        this.actualPosition = {...initial_state};

        this.isOpen = this.props.isOpen;

        this.panResponder = PanResponder.create(
            {
                onStartShouldSetPanResponder: () => true,
                onPanResponderGrant: (evt, gestureState) => {
                    // The gesture has started. Show visual feedback so the user knows
                    // what is happening!
                    // gestureState.d{x,y} will be set to zero now
                },
                onPanResponderMove: (evt, gest) => {
                    this.state.panValues.setValue({x: 0, y: this.actualPosition.y + gest.dy})
                },
                onPanResponderRelease: (e, gesture) => {
                    const releaseYPosition = e.nativeEvent.locationY;
                    if (releaseYPosition <= CONTAINER_HEIGHT && releaseYPosition >= 0) {
                        if (gesture.dy >= 0) {
                            this.openMenu();
                        }
                        else if (gesture.dy < 0) {
                            this.closeMenu();
                        }
                    }
                    else if (releaseYPosition > CONTAINER_HEIGHT) {
                        let toHeight = this.dy >= CONTAINER_HEIGHT ? CONTAINER_HEIGHT : -(TOTAL_HEIGHT - CONTAINER_HEIGHT) + RESPONDING_BOX_HEIGHT;
                        Animated.spring(
                            this.state.panValues,
                            {
                                toValue: {
                                    x: 0,
                                    y: toHeight
                                },
                                bounciness: 0,
                                speed: 40
                            }
                        ).start(() => {
                            this.actualPosition = {x: 0, y: toHeight}
                        })
                    }
                    else if (releaseYPosition <= 0) {
                        Animated.spring(
                            this.state.panValues,
                            {
                                toValue: {x: 0, y: -TOTAL_HEIGHT + RESPONDING_BOX_HEIGHT},
                                bounciness: 0,
                                speed: 40
                            }
                        ).start(() => {
                            this.actualPosition = {x: 0, y: -TOTAL_HEIGHT + RESPONDING_BOX_HEIGHT}
                        })

                    }
                    else {
                        console.log('Unhandled gesture');
                    }


                }
            }
        )
    }


    componentWillReceiveProps(nextProps) {
        const {isOpen} = nextProps;

        if (isOpen && this.isOpen === false) {
            this.openMenu();
        }
        else if (!isOpen && this.isOpen === true) {
            this.closeMenu();
        }

    }

    openMenu() {
        Animated.spring(
            this.state.panValues,
            {
                toValue: {x: 0, y: -(TOTAL_HEIGHT - CONTAINER_HEIGHT) + RESPONDING_BOX_HEIGHT},
                bounciness: 0,
                speed: 40
            }
        ).start(() => {
            this.actualPosition = {
                x: 0,
                y: -(TOTAL_HEIGHT - CONTAINER_HEIGHT) + RESPONDING_BOX_HEIGHT
            };
            this.isOpen = true;
        });


    }

    closeMenu() {
        Animated.spring(
            this.state.panValues,
            {
                toValue: {x: 0, y: -TOTAL_HEIGHT + RESPONDING_BOX_HEIGHT},
                bounciness: 0,
                speed: 40
            }
        ).start(() => {
            this.actualPosition = {
                x: 0,
                y: -TOTAL_HEIGHT + RESPONDING_BOX_HEIGHT
            };
            this.isOpen = false;
        });


    }

    toggleSwitch(category, index, newVal, callback) {
        const updVal = {};
        updVal[category] = [
            ...this.state.switchesState[category].slice(0, index),
            newVal,
            ...this.state.switchesState[category].slice(index + 1)
        ];
        this.setState(
            {
                switchesState: {
                    ...this.state.switchesState,
                    ...updVal
                }
            }
        );

        callback(newVal);
    }

    showSwitches(category) {
        this.setState({
            activeSwitchesBox: category
        })
    }

    render() {

        return (

            <Animated.View
                style={[styles.rootContainer, this.state.panValues.getLayout(), {transform: [{translateY: this.props.verticalOffset}]}]}>
                <View id='overflow'
                      style={styles.overflowBackground}>
                    <View style={styles.overflowForeground}>
                    </View>
                </View>
                <View id="container"
                      style={styles.containerBackground}>
                    <View style={styles.containerForeground}>
                        <View style={styles.categoriesContainer}>

                            {
                                Object.entries(this.props.elements)
                                    .map(keyVal => <CategoryButton label={keyVal[0]}
                                                                   key={keyVal[0]}
                                                                   active={keyVal[0] === this.state.activeSwitchesBox}
                                                                   imgPaths={{
                                                                       active: keyVal[1].selectedImg,
                                                                       default: keyVal[1].defaultImg
                                                                   }}
                                                                   onPress={() => this.showSwitches(keyVal[0])}/>)
                            }


                        </View>
                        <View style={styles.switchesCarousel}>
                            {

                                Object.entries(this.props.elements)
                                    .map(keyVal => <SwitchBox key={keyVal[0]}
                                                              switches={keyVal[1].switches}
                                                              switchesState={this.state.switchesState[keyVal[0]]}
                                                              toggleFunction={this.toggleSwitch.bind(this)}
                                                              id={keyVal[0]}
                                                              category={keyVal[0]}
                                                              display={keyVal[0] === this.state.activeSwitchesBox ? 'flex' : 'none'}
                                        />
                                    )
                            }
                        </View>
                    </View>
                    {
                        this.props.isLoading &&
                        <ActivityIndicator color={"#000000"} size={'small'} style={styles.loading}/>
                    }
                </View>
                <View id="flap"
                      {...this.panResponder.panHandlers}
                      style={styles.flapBackground}>
                    <Image source={this.props.flapImage}
                           style={styles.flapForeground}></Image>
                </View>
            </Animated.View>
        )
    }

}

SlideMenu.defaultProps = {
    isOpen: false,
    isLoading: false,
    elements: {
        'category A': {
            selectedImg: '',
            defaultImg: '',
            switches: [
                {
                    label: 'Switch 1A',
                    callback: (swtVal) => alert(`Switched to ${swtVal}`)
                },
                {
                    label: 'Switch 2A',
                    callback: (swtVal) => alert(`Switched to ${swtVal}`)
                },
                {
                    label: 'Switch 3A',
                    callback: (swtVal) => alert(`Switched to ${swtVal}`)
                }
            ]
        },
        'category B': {
            selectedImg: '',
            defaultImg: '',
            switches: [
                {
                    label: 'Switch 1B',
                    callback: (swtVal) => alert(`Switched to ${swtVal}`)
                },
                {
                    label: 'Switch 2B',
                    callback: (swtVal) => alert(`Switched to ${swtVal}`)
                },
                {
                    label: 'Switch 3B',
                    callback: (swtVal) => alert(`Switched to ${swtVal}`)
                },
            ]
        }
    },
    verticalOffset: 0
};

SlideMenu.propTypes = {
    elements: PropTypes.object.isRequired,
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    flapImage: PropTypes.string.isRequired,
    verticalOffset: PropTypes.number
};

const styles = StyleSheet.create({
    rootContainer: {
        height: CONTAINER_HEIGHT + SCREEN_HEIGHT + RESPONDING_BOX_HEIGHT,
        zIndex: 3,
        position: 'absolute'
    },
    overflowBackground: {
        width: SCREEN_WIDTH,
        height: OVERFLOW_HEIGHT,
        backgroundColor: 'rgba(255,255,255,0.0)',
        position: 'relative'
    },
    overflowForeground: {
        width: OVERFLOW_WIDTH,
        height: OVERFLOW_HEIGHT,
        backgroundColor: BACKGROUND_COLOR,
        position: 'absolute',
        left: LEFT_GAP,
        borderLeftWidth: 1.5,
        borderRightWidth: 1.5,
        borderColor: COLORS.brandFirst
    },
    containerBackground: {
        width: SCREEN_WIDTH,
        height: CONTAINER_HEIGHT,
        backgroundColor: 'rgba(255,255,255,0.0)',
        position: 'relative'
    },
    containerForeground: {
        position: 'absolute',
        backgroundColor: BACKGROUND_COLOR,
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT,
        left: LEFT_GAP,
        borderRadius: 4,
        borderLeftWidth: 1.5,
        borderBottomWidth: 1.5,
        borderRightWidth: 1.5,
        borderColor: "#000000",
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center'
    },
    flapBackground: {
        top: -2,
        height: RESPONDING_BOX_HEIGHT,
        width: SCREEN_WIDTH,
        backgroundColor: 'rgba(255,255,255,0.0)',
        zIndex: 10
    },
    flapForeground: {
        left: SCREEN_HORIZONTAL_CENTER - Math.floor(BUTTON_WIDTH / 2)
    },
    switchesContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: CONTAINER_WIDTH,
        height: CONTAINER_BOX_HEIGHT,
    },
    switchContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        width: Math.floor(CONTAINER_WIDTH / MAX_SWITCHES_PER_ROW),
        marginTop: 10,
        marginBottom: 10
    },
    categoriesContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        width: CONTAINER_WIDTH,
        height: CONTAINER_BOX_HEIGHT,
        borderBottomWidth: 1,
        padding: 10
    },
    categoryContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center'
    },
    switchesCarousel: {
        width: CONTAINER_WIDTH,
        height: CONTAINER_BOX_HEIGHT,
        alignItems: 'center'
    },
    categoryImage: {
        width: 80,
        height: 80,
        borderRadius: 50
    },
    loading: {
        bottom: 20,
        alignSelf: 'center',
        position: 'absolute'
    }
});
