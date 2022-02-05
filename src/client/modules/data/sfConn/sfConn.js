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
    if (records.length === 0) return;
    let data = {
        records: records,
        sObjectType: 'SolarBot_Status__c'
    };
    const params = data;
    const options = {
        method: 'POST',
        body: JSON.stringify(params),
        mode: 'no-cors',
        headers: { Accept: 'application/json' }
    };
    const resp = await fetch(
        `https://intelligent-cloud-app.herokuapp.com/update`,
        options
    );
    let result = await resp.json();
    // eslint-disable-next-line consistent-return
    return result;
};
