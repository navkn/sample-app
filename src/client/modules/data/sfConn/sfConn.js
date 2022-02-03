export const getDataFromSF = async () => {
    const resp = await fetch(
        `https://intelligent-cloud-app.herokuapp.com/read`,
        {
            mode: 'no-cors',
            headers: { Accept: 'application/json' }
        }
    );
    var result = await resp.json();
    console.log(result);
    return result;
};
