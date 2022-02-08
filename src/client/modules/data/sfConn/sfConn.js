export const getDataFromSF = async () => {
    const options = {
        method: 'GET',
        mode: 'no-cors',
        headers: { Accept: 'application/json' }
    };
    const resp = await fetch(
        `https://intelligent-cloud-app.herokuapp.com/read`,
        options
    );
    var result = await resp.json();
    return result;
};

export const updateDataIntoSF = async (records) => {
    //if (records.length === 0) return;
    // let data = {
    //     records: records,
    //     sObjectType: 'SolarBot_Status__c'
    // };
    records.sObjectType = 'SolarBot_Status__c';
    console.log('records', records);
    // const params = data;
    const options = {
        method: 'GET',
        body: records,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    // console.log('data', data, 'params', params, 'options', options);
    const resp = await fetch(
        `https://intelligent-cloud-app.herokuapp.com/update`,
        options
    );
    let result = await resp.json();
    // eslint-disable-next-line consistent-return
    return result;
};
