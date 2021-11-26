
import { suite, test } from '@testdeck/mocha';
// import * as _chai from 'chai';
import { expect, assert } from 'chai';

// _chai.should();
// _chai.expect;


import DraftMill3DStrategy from '../../../../../../src/equipment/cnc5AxisRouter/cam/analyse/strategy/DraftMill3DStrategy';
import { StlModel, StlModelLink } from '../../../../../../src/equipment/cnc5AxisRouter/cam/StlModel';


type Point3 = {
    x: number;
    y: number;
    z: number;
};

const resourcesPath = '../../../../../resources';

/**
 * Тестирование стратегии DraftMill3DStrategy
 */
@suite 
class DraftMill3DStrategyTest{

    private SUT: DraftMill3DStrategy;
    private diam: number;
    private diamDraftDelta: number;
    private accuracy: number;


    before(){

        this.diam = 8;
        this.diamDraftDelta = 2;
        this.accuracy = 0.1;

        const model = new StlModel();
        const link = new StlModelLink(model);
        link.size = {x: 99.399, y: 99.399, z: 10.325};

        this.SUT = new DraftMill3DStrategy({
            link: link,
            diam: this.diam, 
            diamDraftDelta: this.diamDraftDelta
        }, this.accuracy);

    }

    // @test 'run' (){
    //     (this.SUT).run([]);
    //     // expect().to.be.undefined();
    // }

    @test
    rDraftA(){
        expect( this.SUT.rDraftA ).to.be.equal(50);
    }

    @test
    modelNotLink(){

        let SUT2 = new DraftMill3DStrategy({
            diam: this.diam, 
            diamDraftDelta: this.diamDraftDelta
        }, this.accuracy);

        SUT2.run([]);

        expect( SUT2.areas.length ).to.be.equal(0);

    }

    @test
    getMapCellOutBounds(){
        expect( this.SUT.getMapCell(-1, 2) ).to.be.equal(-1);
        expect( this.SUT.getMapCell(2, -1) ).to.be.equal(-1);
        expect( this.SUT.getMapCell(1e6, 0) ).to.be.equal(-1);
        expect( this.SUT.getMapCell(1e6, 1e6) ).to.be.equal(-1);
    }

    @test
    modelLink(){

        let fname = 'model1.json';
        const dataGrayMap: Array<Point3> = require(resourcesPath+'/'+fname);

        this.SUT.run(dataGrayMap);

        expect( this.SUT.areas.length ).to.be.equal(1);

        let area = this.SUT.areas[0];
        
        expect( area.entrance.p1.x ).to.be.equal( 44 );
        expect( area.entrance.p1.y ).to.be.equal( 12 );
        expect( area.entrance.p2.x ).to.be.equal( 48 );
        expect( area.entrance.p2.y ).to.be.equal( 12 );
        
        expect( area.paths.length ).to.be.equal( 8 );
        expect( area.perimeterPaths.length ).to.be.equal( 1 );

        let perimeterPath = area.perimeterPaths[0];

        expect( perimeterPath.points.length ).to.be.equal( 1141 );

    }
    

}

// describe('qwe', () => {
//     it('asd', () => {
//         assert.eq
//     })
// })

