/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - prihdmitriy@yandex.ru
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
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import AddIcon from '@material-ui/icons/Add';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

import Grid from '@material-ui/core/Grid';

import {AppContext} from './AppContext';

import DialogModal from './DialogModal';
import EquipmentParams from './EquipmentParams';


const styles = {
    root: {
        // maxWidth: 345,
        // minWidth: 345,
        // float: 'left',
        // margin: '0 1rem 1rem 0',
        // minHeight: 120,
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

        // console.log('Equipments constructor');


    }


    componentDidMount() {

        // console.log('localStorage', localStorage.getItem('routers'));

        let items = EquipmentsAPI.items;

        let _this = this;

        // EquipmentsAPI.items = items;

        if(items.length == 1){

            this.handleItemSelect(items[0]);

        } 
        // else{

        items.map(item => {
            if(typeof EquipmentsAPI.itemsWs[item.name] !== "undefined")
                return;

            let wsUrl = 'ws://'+item.url+'/';
            console.log('WebSocket: '+wsUrl);
            let ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';

            item.stateConnect = Equipments.STATE_CONNECTING;
            ws.onopen = (event) => {
                console.log('ws.onopen');
                item.stateConnect = Equipments.STATE_CONNECTED;
                _this.setState({items: items});
                
            }

            ws.onmessage = (event) => {
                // console.log('ws.onmessage');
                if(event.data instanceof ArrayBuffer){
                    // let data = new Uint8Array(event.data);

                    if(typeof this.props.onWsRecieve === 'function'){
                        this.props.onWsRecieve(item, event.data);
                    }
            

                    // console.log(data);
                    // console.log(new Float32Array(data.slice(2, 6), 0, 4));
                    // let x = new Float32Array(event.data.slice(2, 6), 0, 1)[0];
                    // let y = new Float32Array(event.data.slice(6, 10), 0, 1)[0];
                    // x = parseFloat(x);
                    // let x = new Float32Array(event.data.slice(2, 4), 0, 4);
                    // let y = new Float32Array(event.data.slice(6, 4), 0, 4);
                    // console.log(x, y);
                }
    
                // console.log(event.data);
    
            }

            ws.onclose = (event) => {
                console.log('ws.onclose');
                item.stateConnect = Equipments.STATE_NONE;
                _this.setState({items: items});
            }

            ws.onerror = (event) => {
                console.log('ws.onerror');
                item.stateConnect = Equipments.STATE_ERROR;
                _this.setState({items: items});
            }


            EquipmentsAPI.itemsWs[item.name] = ws;
            _this.setState({items: items});
        });

        // }

        this.setState({items: items});

        // console.log(this.context);

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

    /**
     * Получить цвет по статусу соединения с сервером
     * @param {int} state 
     */
    // getColorByStateConnect(state){

    // }


    render() {

        const { items } = this.state;

        // console.log(Equipments.STATE_CONNECT_COLOR);

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
                                            {/* {item.type === Equipments.TYPE_CNC_ROUTER &&
                                                <TypeCncRouter item={item} />
                                            } */}
                                            {item.type} <br/>
                                            {item.url} <FiberManualRecordIcon style={{fontSize: 'inherit', float: 'left', margin: '3px 5px 0 0', color: Equipments.STATE_CONNECT_COLOR[item.stateConnect]}} />

                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                                {/* <CardActions>
                                    <Button size="small" color="primary">
                                        Share
                                    </Button>
                                    <Button size="small" color="primary">
                                        Learn More
                                    </Button>
                                </CardActions> */}
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


// function TypeCncRouter(props){

//     const { item } = props;

//     return (
//         <React.Fragment>
//             {item.type} <br/>
//             {item.url}
//         </React.Fragment>
//     );
// }

Equipments.defaultProps = {

    onSelect: null,             // функция вызываемая при выборе элемента

};


window.Equipments = (() => {

    const initItems = () => {
        let items = [
            {
                type: Equipments.TYPE_CNC_ROUTER, 
                caption: 'Plasma', 
                name: 'cncPlasma', 
                url: '192.168.1.65', 
                // url: '192.168.1.113', 
                stateConnect: Equipments.STATE_NONE, 
                params: {x: 1300, y: 2500, z: 120}
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
                params: {}
            },
            // {type: Equipments.TYPE_FREQ_CONVERTER, caption: 'Частотник', name: 'freqConv1', url: '192.168.4.3', params: {}},
            // {type: Equipments.TYPE_FREQ_CONVERTER, caption: 'Частотник', name: 'freqConv1', url: '192.168.4.3', params: {}},
            // {type: Equipments.TYPE_FREQ_CONVERTER, caption: 'Частотник', name: 'freqConv1', url: '192.168.4.3', params: {}},
            {type: Equipments.TYPE_RMT_1, caption: 'Минитрактор 1', name: 'rmt1_1', url: '192.168.4.4', stateConnect: Equipments.STATE_NONE, params: {}},
            {type: Equipments.TYPE_RMT_1, caption: 'Минитрактор 2', name: 'rmt1_2', url: '192.168.4.5', stateConnect: Equipments.STATE_NONE, params: {}},
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
        EquipmentsAPI.items = items;
    }

    const getItem = (name) => {
        let item = null;
        EquipmentsAPI.items.map((el => {
            if(el.name == name) item = el;
        }));
        if(item === null)
            throw new Error('Item "'+name+'" not found.');
        return item;
    }

    return {
        initItems: initItems,
        getItems: () => [...EquipmentsAPI.items],
        getItem: getItem,
        getItemWs: (name) => {
            let item = getItem(name);
            let ws = typeof EquipmentsAPI.itemsWs[name] !== "undefined" ? EquipmentsAPI.itemsWs[name] : null;
            if(ws === null)
                throw new Error('WebSocket for "'+name+'" not created.');
            return ws;
        }
    };
})();

export default Equipments;
// export default React.memo(Equipments);

