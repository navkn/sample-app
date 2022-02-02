import { LightningElement, wire } from 'lwc';
// eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
import getAccountRecords from 'data/sfWire';
const columns = [
    { label: 'Account Name', fieldName: 'Name' },
    { label: 'Account Site', fieldName: 'Site', type: 'url' },
    { label: 'Account Phone', fieldName: 'Phone', type: 'phone' }
];
export default class App extends LightningElement {
    result;
    columns = columns;
    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(getAccountRecords) getRecords({ data, error }) {
        console.log('Fetching the records');
        if (data) {
            console.log('got data', data);
            this.result = data.records;
        }
        if (error) {
            console.log('got error', error);
        }
    }
}
