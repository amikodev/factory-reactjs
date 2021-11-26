/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020-2021 Prihodko Dmitriy - asketcnc@yandex.ru
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
// import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
// import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
// import CardMedia from '@material-ui/core/CardMedia';
// import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

// import AddIcon from '@material-ui/icons/Add';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

import Grid from '@material-ui/core/Grid';

import {AppContext} from './AppContext';

import DialogModal from './DialogModal';
import EquipmentParams from './EquipmentParams';


const styles = {
    root: {

    },
};

let EquipmentsAPI = {
    items: null,
    itemsWs: {},        // WebSocket соединения с оборудованием
};

class Equipments extends React.Component {

    static contextType = AppContext;

    static TYPE_CNC_ROUTER = 'CNC Router';
    static TYPE_CNC_ANGLE = 'CNC Angle';
    static TYPE_CNC_LATHE = 'CNC Lathe';
    static TYPE_OIL_STATION = 'Oil Station';
    static TYPE_FREQ_CONVERTER = 'Freq Converter';
    static TYPE_RMT_1 = 'RMT-1';
    static TYPE_CNC_5_AXIS_ROUTER = 'CNC 5 axis Router';

    static STATE_NONE = 0;
    static STATE_CONNECTED = 1;
    static STATE_CONNECTING = 2;
    static STATE_ERROR = 3;

    static STATE_CONNECT_COLOR = {
        [Equipments.STATE_NONE]: 'inherit',
        [Equipments.STATE_CONNECTED]: '#0B0',
        [Equipments.STATE_CONNECTING]: '#DA0',
        [Equipments.STATE_ERROR]: '#F00',
    };

    constructor(props){
        super(props);

        this.state = {
            items: [],      // type, caption, name, url, params
            openNewEquipment: false,
        };

    }


    componentDidMount() {
        let items = EquipmentsAPI.items;
        let _this = this;
        if(items.length === 1){
            this.handleItemSelect(items[0]);
        } 

        let tryWsConnectCounts = {};
        let maxTries = 10;      // максимальное количество подряд неудачных соединений

        items.map(item => {
            if(typeof EquipmentsAPI.itemsWs[item.name] !== "undefined")
                return null;

            let wsConnect = () => {
                let wsUrl = 'ws://'+item.url+'/';
                console.log('WebSocket: '+wsUrl);
                let ws = new WebSocket(wsUrl);
                ws.binaryType = 'arraybuffer';

                tryWsConnectCounts[item.name] = 0;

                item.stateConnect = Equipments.STATE_CONNECTING;
                if(typeof this.props.onWsStateChange === 'function'){
                    this.props.onWsStateChange(item, 'connecting');
                }

                ws.onmessage = (event) => {
                    if(event.data instanceof ArrayBuffer){
                        if(typeof this.props.onWsRecieve === 'function'){
                            this.props.onWsRecieve(item, event.data);
                        }
                    }
                }

                ws.onopen = (event) => {
                    console.log('ws.onopen');
                    item.stateConnect = Equipments.STATE_CONNECTED;
                    _this.setState({items: items});
                    tryWsConnectCounts[item.name] = 0;
                    if(typeof this.props.onWsStateChange === 'function'){
                        this.props.onWsStateChange(item, event.type);
                    }
                }

                ws.onclose = (event) => {
                    console.log('ws.onclose');
                    item.stateConnect = Equipments.STATE_NONE;
                    _this.setState({items: items});
                    tryWsConnectCounts[item.name]++;
                    if(typeof this.props.onWsStateChange === 'function'){
                        this.props.onWsStateChange(item, event.type);
                    }
                    if(tryWsConnectCounts[item.name] < maxTries){
                        setTimeout(() => {
                            wsConnect();
                        }, 1000);
                    }
                }

                ws.onerror = (event) => {
                    console.log('ws.onerror');
                    item.stateConnect = Equipments.STATE_ERROR;
                    _this.setState({items: items});
                    if(typeof this.props.onWsStateChange === 'function'){
                        this.props.onWsStateChange(item, event.type);
                    }
                }

                EquipmentsAPI.itemsWs[item.name] = ws;
            }

            let wsEnabled = item.wsEnabled ?? true;
            if(wsEnabled){
                wsConnect();
            }

            _this.setState({items: items});
            return null;
        });

        this.setState({items: items});
    }

    handleItemSelect(item){
        if(typeof this.props.onSelect === 'function'){
            this.props.onSelect(item);
        }
    }

    handleAddClick(){
        this.setState({openNewEquipment: true});
    }

    handleSaveEquipment(params){

        console.log('save params');
        this.setState({openNewEquipment: false});
    }

    render() {
        const { items } = this.state;

        return (
            <div>
                <Grid container spacing={3}>
                    {items.map((item, ind) => {
                        return (
                            <Grid key={ind} item xs={12} sm={6} xl={3}>
                            <Card style={styles.root}>
                                <CardActionArea onClick={e => this.handleItemSelect(item)}>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="h4" style={{overflow: 'hidden', height: '2rem', lineBreak: 'anywhere'}}>
                                            {item.caption}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" component="div">
                                            {item.type} <br/>
                                            {item.url} <FiberManualRecordIcon style={{fontSize: 'inherit', float: 'left', margin: '3px 5px 0 0', color: Equipments.STATE_CONNECT_COLOR[item.stateConnect]}} />
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                            </Grid>
                        );
                    })}

                    {false &&
                    <Grid item xs={12} sm={6} xl={3}>
                        <Card style={styles.root}>
                            <CardActionArea onClick={e => this.handleAddClick()}>
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="h2" align="center">
                                        {/* <AddIcon fontSize='large' /> */}
                                        +
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" component="p" align="center">
                                        {('Добавить оборудование')} <br/>
                                        &nbsp;
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                    }

                </Grid>

                {this.state.openNewEquipment &&
                <DialogModal 
                    caption={('Оборудование')} 
                    component={<EquipmentParams />}
                    saveCaption={('Сохранить')}
                    onClose={() => {this.setState({openNewEquipment: false})}} 
                    onSave={(params) => this.handleSaveEquipment(params)}
                />
                }

            </div>
        );
    }
}

Equipments.defaultProps = {

    onSelect: null,             // функция вызываемая при выборе элемента
    onWsStateChange: null,

};


window.Equipments = (() => {

    let equipmentItems = [
        {
            type: Equipments.TYPE_CNC_ROUTER, 
            caption: 'Plasma', 
            name: 'cncPlasma', 
            url: '192.168.1.65', 
            // url: '192.168.1.113', 
            stateConnect: Equipments.STATE_NONE, 
            params: {x: 1250, y: 2500, z: 120},
            wsEnabled: false,
        },
        // {
        //     type: Equipments.TYPE_CNC_ROUTER, 
        //     caption: 'Plasma 2', 
        //     name: 'cncPlasma2', 
        //     url: '192.168.1.113', 
        //     stateConnect: Equipments.STATE_NONE, 
        //     params: {x: 1300, y: 2500, z: 120}
        // },
        // {type: Equipments.TYPE_CNC_ANGLE, caption: 'Plasma angle', name: 'cncPlasmaAngle', url: '192.168.4.1', stateConnect: Equipments.STATE_NONE, params: {x: 1500, y: 2500, z: 120}},
        // {type: Equipments.TYPE_CNC_LATHE, caption: 'Токарный станок', name: 'cnc_lathe_1', url: '192.168.4.2', params: {x: 500, z: 50}},
        {
            type: Equipments.TYPE_FREQ_CONVERTER, 
            caption: 'Частотный преобр.', 
            name: 'freqConv1', 
            url: '192.168.4.3', 
            stateConnect: Equipments.STATE_NONE, 
            params: {},
            wsEnabled: false,
        },
        // {type: Equipments.TYPE_FREQ_CONVERTER, caption: 'Частотник', name: 'freqConv1', url: '192.168.4.3', params: {}},
        // {type: Equipments.TYPE_FREQ_CONVERTER, caption: 'Частотник', name: 'freqConv1', url: '192.168.4.3', params: {}},
        // {type: Equipments.TYPE_FREQ_CONVERTER, caption: 'Частотник', name: 'freqConv1', url: '192.168.4.3', params: {}},
        {type: Equipments.TYPE_RMT_1, caption: 'Минитрактор 1', name: 'rmt1_1', url: '192.168.4.4', stateConnect: Equipments.STATE_NONE, params: {}, wsEnabled: false},
        {type: Equipments.TYPE_RMT_1, caption: 'Минитрактор 2', name: 'rmt1_2', url: '192.168.4.5', stateConnect: Equipments.STATE_NONE, params: {}, wsEnabled: false},
        {
            type: Equipments.TYPE_CNC_5_AXIS_ROUTER,
            caption: '5 Axis',
            name: 'cnc5axis',
            url: '192.168.1.65',
            stateConnect: Equipments.STATE_NONE,
            params: {},
            wsEnabled: false,
        },
    ];
    // console.log(window.location, window.location.hostname);
    // items = [
    //     {
    //         type: Equipments.TYPE_CNC_ROUTER, 
    //         caption: 'Plasma', 
    //         name: 'cncPlasma', 
    //         // url: '192.168.1.65', 
    //         // url: '192.168.1.113', 
    //         url: window.location.hostname,
    //         stateConnect: Equipments.STATE_NONE, 
    //         params: {x: 1300, y: 2500, z: 120}
    //     },
    // ];

    const initItems = () => {
        EquipmentsAPI.items = equipmentItems;
    }

    const initItem = (name) => {
        try{
            let item = getItem(name);

            if(window.location.hostname !== "localhost"){
                item.url = window.location.hostname;
            }
            console.log('Item "'+ name +'" url: '+ item.url);


            EquipmentsAPI.items = [ item ];
        } catch(e){
            console.log(e);
        }
    }

    const getItem = (name) => {
        let item = null;
        equipmentItems.map((el => {
            if(el.name === name) item = el;
            return null;
        }));
        if(item === null)
            throw new Error('Item "'+name+'" not found.');
        return item;
    }

    return {
        initItems,
        initItem,
        getItems: () => [...EquipmentsAPI.items],
        getItem,
        getItemWs: (name) => {
            let ws = typeof EquipmentsAPI.itemsWs[name] !== "undefined" ? EquipmentsAPI.itemsWs[name] : null;
            if(ws === null)
                throw new Error('WebSocket for "'+name+'" not created.');
            return ws;
        }
    };
})();

export default Equipments;

