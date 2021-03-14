/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - asketcnc@yandex.ru
*/

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';

import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';

import PanToolIcon from '@material-ui/icons/PanTool';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
import AllOutIcon from '@material-ui/icons/AllOut';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';

import {AppContext} from '../AppContext';

import { OBJ_NAME_COORDS, OBJ_NAME_COORD_SYSTEM } from './CncRouter';

class CncRouterPointer extends React.Component{

    static contextType = AppContext;

    /**
     * {@inheritdoc}
     */
    constructor(props){
        super(props);

        this.setCurrentPointer = this.setCurrentPointer.bind(this);
        this.setSelectedPointer = this.setSelectedPointer.bind(this);
        this.getCanvasRef = this.getCanvasRef.bind(this);
        this.calcCanvasZoom = this.calcCanvasZoom.bind(this);
        this.setZoom = this.setZoom.bind(this);

        this.state = {

            width: 0,
            height: 0,
            itemX: 0,
            itemY: 0,


            mousePointer: { screen: null, offset: null, tooltip: null, device: {x: 0, y: 0} },     // screen: {x: 0, y: 0}, offset: {x: 0, y: 0}
            selectedPointer: { screen: null, device: {x: 0, y: 0} },
            currentPointer: { screen: null, tooltip: null, device: {x: 0, y: 0} },

            isPanMode: false,       // режим масштабирования и навигации

            zoom: 1,                // масштаб
            navLeft: 0,             // навигация, смещение слева
            navTop: 0,              // навигация, смещение сверху

            userZeroPoint: {x: 0, y: 0, z: 0, a: 0, b: 0, c: 0},

        };

        this.refCanvas = React.createRef();
        this._ctx = null;

        this.itemX = 0;
        this.itemY = 0;
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        this.navEnable = false;
        this.navX = 0;
        this.navY = 0;

    }

    /**
     * {@inheritdoc}
     */
    componentDidMount(){
        const { addListenerWsRecieve } = this.context;
        const { getPointXYZ } = this.context;
        const { item } = this.props;

        let canvas = this.refCanvas.current;
        if(canvas.getContext){
            this._ctx = canvas.getContext('2d');

            const calcSize = () => {
                let posInfo = canvas.parentNode.getBoundingClientRect();

                if(posInfo.width === 0 && posInfo.height === 0){
                    window.setTimeout(calcSize, 100);
                    return;
                }

                let width = posInfo.width;

                this.itemX = parseFloat(item.params.x);
                this.itemY = parseFloat(item.params.y);
    
                this.canvasWidth = width - 50*2;
                this.canvasHeight = this.canvasWidth*this.itemY/this.itemX;


                let maxHeight = 600;

                if(this.canvasHeight > maxHeight){
                    this.canvasHeight = maxHeight;
                    this.canvasWidth = this.canvasHeight*this.itemX/this.itemY;
                }
    
                this.setState({
                    width: this.canvasWidth,
                    height: this.canvasHeight,
                    itemX: this.itemX,
                    itemY: this.itemY,
                }, () => {
                    if(typeof this.props.onReady === "function"){
                        this.props.onReady();
                    }

                    addListenerWsRecieve(item.name, (data) => {
                        let data2 = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
                        if(data2[0] === OBJ_NAME_COORDS){
                            let currentPoint = getPointXYZ(data, 2);
                            // console.log('currentPoint', JSON.stringify(currentPoint));
                            this.setCurrentPointer(currentPoint.x, currentPoint.y);
                        } else if(data2[0] === OBJ_NAME_COORD_SYSTEM){
                            let userZeroPoint = getPointXYZ(data, 2);
                            // console.log('userZeroPoint', JSON.stringify(userZeroPoint));
                            let selectedPointer = Object.assign({}, this.state.selectedPointer);
                            selectedPointer.screen = null;
                            this.setState({userZeroPoint, selectedPointer});
                        }
                    });
                });
            }

            window.setTimeout(calcSize, 100);
        }
    }

    /**
     * {@inheritdoc}
     */
    componentDidUpdate(prevProps){
        const { selectedPointer } = this.props;

        if(JSON.stringify(this.props.selectedPointer) !== JSON.stringify(prevProps.selectedPointer)){
            if(isNaN(selectedPointer.x) || isNaN(selectedPointer.y)){
                // this.setSelectedPointer(null, null);
                let selectedPointer = Object.assign({}, this.state.selectedPointer);
                selectedPointer.screen = null;
                this.setState({selectedPointer: selectedPointer});
            } else{
                this.setSelectedPointer(selectedPointer.x, selectedPointer.y);
            }
        }
    }

    /**
     * Выделение выбранной точки
     */
    handleSelectMouseUp(event){
        let oX = event.nativeEvent.offsetX;
        let oY = event.nativeEvent.offsetY;

        const { userZeroPoint } = this.state;

        let selectedPointer = Object.assign({}, this.state.selectedPointer);

        let odX = oX - this.state.navLeft;
        let odY = oY + this.state.navTop;

        let mouseDeviceX = odX > 0 ? odX/this.canvasWidth*this.itemX : 0;
        let mouseDeviceY = odY > 0 ? odY/this.canvasHeight*this.itemY : 0;

        mouseDeviceY = this.itemY - mouseDeviceY;       // ноль в левом нижнем углу

        mouseDeviceX /= this.state.zoom;
        mouseDeviceY /= this.state.zoom;

        mouseDeviceX -= userZeroPoint.x;
        mouseDeviceY -= userZeroPoint.y;

        mouseDeviceX = mouseDeviceX.toFixed(3);
        mouseDeviceY = mouseDeviceY.toFixed(3);

        // mousePointer.offset = {x: oX, y: oY};
        selectedPointer.screen = {x: oX+50, y: oY+30};
        // mousePointer.tooltip = {x: oX+50+20, y: oY+30+20};
        selectedPointer.device = {x: mouseDeviceX, y: mouseDeviceY};
        // console.log(JSON.stringify(mousePointer));

        this.setState({selectedPointer: selectedPointer}, () => {
            if(typeof this.props.onSelectPointer === "function"){
                this.props.onSelectPointer({x: mouseDeviceX, y: mouseDeviceY});
            }
        });

    }

    /**
     * Перемещение текущих координат при движении мышкой
     */
    handleSelectMouseMove(event){
        let oX = event.nativeEvent.offsetX;
        let oY = event.nativeEvent.offsetY;

        const { userZeroPoint } = this.state;

        let mousePointer = Object.assign({}, this.state.mousePointer);

        let odX = oX - this.state.navLeft;
        let odY = oY + this.state.navTop;

        let mouseDeviceX = odX/this.canvasWidth*this.itemX;
        let mouseDeviceY = odY/this.canvasHeight*this.itemY;


        mouseDeviceY = this.itemY - mouseDeviceY;       // ноль в левом нижнем углу

        mouseDeviceX /= this.state.zoom;
        mouseDeviceY /= this.state.zoom;

        mouseDeviceX -= userZeroPoint.x;
        mouseDeviceY -= userZeroPoint.y;

        mouseDeviceX = mouseDeviceX.toFixed(3);
        mouseDeviceY = mouseDeviceY.toFixed(3);

        mousePointer.offset = {x: oX, y: oY};
        mousePointer.screen = {x: oX+50, y: oY+30};
        mousePointer.tooltip = {x: oX+50+20, y: oY+30+20};
        mousePointer.device = {x: mouseDeviceX, y: mouseDeviceY};

        this.setState({mousePointer: mousePointer});
    }

    /**
     * Текущие координаты с экрана удаляются при уходе мышки за пределы области 
     */
    handleSelectMouseLeave(event){
        let mousePointer = Object.assign({}, this.state.mousePointer);
        mousePointer.offset = null;
        this.setState({mousePointer: mousePointer});
    }

    /**
     * Установка режима масштабирования и навигации
     */
    handlePanClick(event){
        this.setState({isPanMode: !this.state.isPanMode});
    }

    /**
     * Режим масштабирования и навигации.
     * Опускание клавиши мышки.
     */
    handlePanMouseDown(event){
        let oX = event.nativeEvent.offsetX;
        let oY = event.nativeEvent.offsetY;

        this.navX = oX;
        this.navY = oY;

        this.navEnable = true;
    }

    /**
     * Режим масштабирования и навигации.
     * Перемещение мышкой.
     */
    handlePanMouseMove(event){
        if(this.navEnable){
            let oX = event.nativeEvent.offsetX;
            let oY = event.nativeEvent.offsetY;

            let dx = oX - this.navX;
            let dy = oY - this.navY;

            const { navLeft, navTop } = this.state;
            // console.log(this.props.onChangeNav);
            // this.setState({navLeft: navLeft+dx, navTop: navTop+dy}, () => {
            //     if(typeof this.props.onChangeNav === "function"){
            //         this.props.onChangeNav(navLeft+dx, navTop+dy);
            //     }
            // });
            const { device } = this.state.currentPointer;
            // this.setCurrentPointer(device.x, device.y);

            if(typeof this.props.onChangeNav === "function"){
                this.props.onChangeNav(navLeft+dx, navTop-dy);
            }

            // тормоза при перемещении
            // this.setState({navLeft: navLeft+dx, navTop: navTop-dy}, () => {
            //     this.navX += dx;
            //     this.navY += dy;
            //     this.setCurrentPointer(device.x, device.y);
            // });

        }
    }

    /**
     * Режим масштабирования и навигации.
     * Уход мышки за пределы области.
     */
    handlePanMouseLeave(event){
        if(this.navEnable){
            let oX = event.nativeEvent.offsetX;
            let oY = event.nativeEvent.offsetY;

            let dx = oX - this.navX;
            let dy = oY - this.navY;

            const { navLeft, navTop } = this.state;
            this.setState({navLeft: navLeft+dx, navTop: navTop-dy});

            this.navEnable = false;
        }
    }

    /**
     * Режим масштабирования и навигации.
     * Поднятие клавиши мышки.
     */
    handlePanMouseUp(event){
        let oX = event.nativeEvent.offsetX;
        let oY = event.nativeEvent.offsetY;

        let dx = oX - this.navX;
        let dy = oY - this.navY;

        const { navLeft, navTop } = this.state;
        this.setState({navLeft: navLeft+dx, navTop: navTop-dy});

        this.navEnable = false;
    }

    /**
     * Режим масштабирования и навигации.
     * Прикосновение.
     */
     handlePanTouchStart(event){
        let touch = event.targetTouches[0];

        let oX = touch.pageX;
        let oY = touch.pageY;

        this.navX = oX;
        this.navY = oY;

        this.navEnable = true;
    }

    /**
     * Режим масштабирования и навигации.
     * Окончание прикосновения.
     */
     handlePanTouchEnd(event){
        this.navEnable = false;
    }

    /**
     * Режим масштабирования и навигации.
     * Передвижение.
     */
     handlePanTouchMove(event){
        event.preventDefault();
        let touch = event.targetTouches[0];
        if(this.navEnable){
            let oX = touch.pageX;
            let oY = touch.pageY;
    
            let dx = oX - this.navX;
            let dy = oY - this.navY;

            const { navLeft, navTop } = this.state;

            if(typeof this.props.onChangeNav === "function"){
                this.props.onChangeNav(navLeft+dx, navTop-dy);
            }

            // тормоза при перемещении
            this.setState({navLeft: navLeft+dx, navTop: navTop-dy}, () => {
                this.navX += dx;
                this.navY += dy;
            });
        }        
    }

    /**
     * Показать не экране текущие координаты
     */
    setCurrentPointer(devX, devY){
        const { userZeroPoint } = this.state;

        let oX = devX*this.canvasWidth/this.itemX;
        let oY = devY*this.canvasHeight/this.itemY;

        oX = oX*this.state.zoom + this.state.navLeft;
        oY = oY*this.state.zoom + this.state.navTop;

        oY = this.canvasHeight - oY;

        let currentPointer = Object.assign({}, this.state.currentPointer);

        let tX = oX-70/2;
        tX = tX < 0 ? 0 : (tX+70 > this.canvasWidth ? this.canvasWidth-70 : tX);
        tX += 50;

        let tY = oY+70/2;
        tY = tY > this.canvasHeight ? this.canvasHeight : (tY-70 < 0 ? 70 : tY);
        tY += 30;

        devX -= userZeroPoint.x;
        devY -= userZeroPoint.y;

        devX = devX.toFixed(2);
        devY = devY.toFixed(2);

        currentPointer.screen = {x: oX+50, y: oY+30};       // координаты перекрестия точки
        currentPointer.tooltip = {x: tX, y: tY};            // координаты окошка со значениями координат
        currentPointer.device = {x: devX, y: devY};         // значения координат

        this.setState({currentPointer: currentPointer});
    }

    /**
     * Показать на экране выбранные координаты
     */
    setSelectedPointer(devX, devY){
        const { userZeroPoint } = this.state;

        devX += userZeroPoint.x;
        devY += userZeroPoint.y;

        let oX = devX*this.canvasWidth/this.itemX;
        let oY = devY*this.canvasHeight/this.itemY;

        oX = oX*this.state.zoom + this.state.navLeft;
        oY = oY*this.state.zoom + this.state.navTop;

        oY = this.canvasHeight - oY;

        let selectedPointer = Object.assign({}, this.state.selectedPointer);

        selectedPointer.screen = {x: oX+50, y: oY+30};
        selectedPointer.device = {x: devX, y: devY};

        this.setState({selectedPointer: selectedPointer});
    }

    /**
     * Получить референсную ссылку на Canvas
     */
    getCanvasRef(){
        return this.refCanvas;
    }

    /**
     * Получить масштаб для рисования на Canvas
     */
    calcCanvasZoom(){
        return this.canvasWidth/this.state.itemX;
    }

    /**
     * Установка масштаба
     * @param zoom масштаб
     */
    setZoom(zoom){
        this.setState({zoom: zoom}, () => {
            if(typeof this.props.onChangeZoom === "function"){
                this.props.onChangeZoom(zoom);
            }
        });
    }

    /**
     * Увеличение масштаба
     */
    handleZoomInClick(event){
        let { zoom } = this.state;
        zoom = zoom >= 1 ? zoom+1 : zoom*2;
        this.setState({zoom: zoom}, () => {
            if(typeof this.props.onChangeZoom === "function"){
                this.props.onChangeZoom(zoom);
            }
        });
    }

    /**
     * Уменьшение масштаба
     */
    handleZoomOutClick(event){
        let { zoom } = this.state;
        zoom = zoom > 1 ? zoom-1 : zoom/2;
        this.setState({zoom: zoom}, () => {
            if(typeof this.props.onChangeZoom === "function"){
                this.props.onChangeZoom(zoom);
            }
        });
    }

    /**
     * Масштаб и навигация по-умолчанию
     */
    handleDefaultClick(event){
        let zoom = 1;
        let navLeft = 0;
        let navTop = 0;

        this.setState({navLeft: navLeft, navTop: navTop, zoom: zoom}, () => {
            if(typeof this.props.onChangeZoom === "function"){
                this.props.onChangeZoom(zoom);
            }
            if(typeof this.props.onChangeNav === "function"){
                this.props.onChangeNav(navLeft, navTop);
            }

        });

    }

    /**
     * {@inheritdoc}
     */
    render(){

        return (
            <div style={{position: 'relative', height: this.state.height+60}}>

                <Tooltip title={('Меню')} arrow style={{
                    position: 'absolute', top: 0, left: 0,
                    // transformOrigin: '0 0', transform: 'rotate(-90deg)'
                }}>
                    <IconButton color="default" component="span" onClick={null}>
                        <DragIndicatorIcon/>
                    </IconButton>
                </Tooltip>

                <Typography component="div" color="primary" style={{
                    width: this.state.width-100, textAlign: 'center', position: 'absolute', top: 0, left: 100,
                }}>{this.state.itemX}</Typography>
                <Typography component="div" color="primary" style={{
                    width: this.state.height-100, textAlign: 'center', transform: 'rotate(90deg)', position: 'absolute', top: 80, left: this.state.width+50+30, transformOrigin: '0 0',
                }}>{this.state.itemY}</Typography>

                <canvas ref={this.refCanvas} style={{
                    border: '1px #BBB solid', position: 'absolute', top: 30, left: 50,
                    transform: 'scale(1, -1)',
                }} width={this.state.width} height={this.state.height}></canvas>

                {/* <Typography component="div" color="secondary" style={{
                    width: 70, textAlign: 'center', transform: 'rotate(-90deg)', position: 'absolute', top: this.state.height+30, left: 20, transformOrigin: '0 0', backgroundColor: 'antiquewhite', borderRadius: 6,
                }}>{this.state.itemY}</Typography> */}


                {this.state.mousePointer.offset !== null &&
                <React.Fragment>
                    <Box bgcolor='secondary.main' color='secondary.contrastText' p={2} style={{
                        position: 'absolute', padding: '3px 8px', borderRadius: 5,
                        top: this.state.mousePointer.tooltip.y, left: this.state.mousePointer.tooltip.x,
                    }}>
                        {this.state.mousePointer.device.x} <br/> {this.state.mousePointer.device.y}
                    </Box>

                    <div data-pointer style={{
                        borderLeft: '1px #F88 solid', width: 1, height: this.state.height,
                        position: 'absolute', top: 30, left: this.state.mousePointer.screen.x,
                    }}></div>
                    <div data-pointer style={{
                        borderTop: '1px #F88 solid', height: 1, width: this.state.width,
                        position: 'absolute', top: this.state.mousePointer.screen.y, left: 50,
                    }}></div>

                </React.Fragment>
                }

                {this.state.selectedPointer.screen !== null &&
                <React.Fragment>
                    <div data-pointer style={{
                        borderLeft: '1px #DA0 solid', width: 1, height: this.state.height,
                        position: 'absolute', top: 30, left: this.state.selectedPointer.screen.x,
                    }}></div>
                    <div data-pointer style={{
                        borderTop: '1px #DA0 solid', height: 1, width: this.state.width,
                        position: 'absolute', top: this.state.selectedPointer.screen.y, left: 50,
                    }}></div>

                </React.Fragment>
                }

                {this.state.currentPointer.screen !== null &&
                <React.Fragment>
                    <div data-pointer style={{
                        borderLeft: '1px #0B0 solid', width: 1, height: this.state.height,
                        position: 'absolute', top: 30, left: this.state.currentPointer.screen.x,
                    }}></div>
                    <div data-pointer style={{
                        borderTop: '1px #0B0 solid', height: 1, width: this.state.width,
                        position: 'absolute', top: this.state.currentPointer.screen.y, left: 50,
                    }}></div>


                <Typography component="div" color="secondary" style={{
                    width: 70, textAlign: 'center', transform: 'rotate(-90deg)', position: 'absolute', 
                    top: this.state.currentPointer.tooltip.y, left: 20, 
                    transformOrigin: '0 0', backgroundColor: 'antiquewhite', borderRadius: 6,
                }}>{this.state.currentPointer.device.y}</Typography>
                <Typography component="div" color="secondary" style={{
                    width: 70, textAlign: 'center', position: 'absolute', 
                    left: this.state.currentPointer.tooltip.x,
                    top: this.state.height+30+5, 
                    backgroundColor: 'antiquewhite', borderRadius: 6,
                }}>{this.state.currentPointer.device.x}</Typography>

                </React.Fragment>
                }

                <div 
                    onMouseMove  ={e => this.state.isPanMode ? this.handlePanMouseMove(e) : this.handleSelectMouseMove(e)}
                    onMouseLeave ={e => this.state.isPanMode ? this.handlePanMouseLeave(e) : this.handleSelectMouseLeave(e)}
                    onMouseUp    ={e => this.state.isPanMode ? this.handlePanMouseUp(e) : this.handleSelectMouseUp(e)} 
                    onMouseDown  ={e => this.state.isPanMode ? this.handlePanMouseDown(e) : null} 
                    
                    onTouchMove  ={e => this.state.isPanMode ? this.handlePanTouchMove(e) : null}
                    onTouchEnd   ={e => this.state.isPanMode ? this.handlePanTouchEnd(e) : null} 
                    onTouchStart ={e => this.state.isPanMode ? this.handlePanTouchStart(e) : null} 
                    
                    style={{
                        position: 'absolute', top: 30, left: 50, width: this.state.width, height: this.state.height, 
                        backgroundColor: 'white', opacity: 0.0, 
                        touchAction: 'none',
                }}>
                </div>


                <Tooltip title={('Масштаб')} arrow style={{
                    position: 'absolute', top: this.state.height+30-0*48, left: this.state.width+50+5,
                    transformOrigin: '0 0', transform: 'rotate(-90deg)'
                }}>
                    <IconButton color={this.state.isPanMode?'primary':'default'} component="span" onClick={e => this.handlePanClick(e)}>
                        <PanToolIcon/>
                    </IconButton>
                </Tooltip>

                {this.state.isPanMode &&
                <React.Fragment>
                    <Tooltip title={('Увеличение')} arrow style={{
                        position: 'absolute', top: this.state.height+30-1*48, left: this.state.width+50+5,
                        transformOrigin: '0 0', transform: 'rotate(-90deg)'
                    }}>
                        <IconButton color="default" component="span" onClick={e => this.handleZoomInClick(e)}>
                            <ZoomInIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={('Уменьшение')} arrow style={{
                        position: 'absolute', top: this.state.height+30-2*48, left: this.state.width+50+5,
                        transformOrigin: '0 0', transform: 'rotate(-90deg)'
                    }}>
                        <IconButton color="default" component="span" onClick={e => this.handleZoomOutClick(e)}>
                            <ZoomOutIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={('По-умолчанию')} arrow style={{
                        position: 'absolute', top: this.state.height+30-3*48, left: this.state.width+50+5,
                        transformOrigin: '0 0', transform: 'rotate(-90deg)'
                    }}>
                        <IconButton color="default" component="span" onClick={e => this.handleDefaultClick(e)}>
                            <AllOutIcon/>
                        </IconButton>
                    </Tooltip>
                </React.Fragment>
                }


            </div>
        );
    }
}

CncRouterPointer.defaultProps = {
    item: {},                   // свойства оборудования
    selectedPointer: null,      // выбранная точка
    onReady: null,              // функция вызываемая после готовнсти объекта
    onChangeZoom: null,         // функция вызываемая при изменении масштаба
    onChangeNav: null,          // функция вызываемая при навигации
};

export default CncRouterPointer;
