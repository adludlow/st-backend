var checkEnvVars = (requiredVars) => {
    var missingEnvVars = [];
    requiredVars.forEach((it) => {
        if(!process.env.hasOwnProperty(it)){
            missingEnvVars.push(it);
            console.log(`missing env var: ${it}`);
        }
    });
    return missingEnvVars;
};

var getEnvVar = (envVarName, df=undefined) => {
    if(process.env[envVarName] !== undefined) {
        return process.env[envVarName];
    }
    else {
        return df;
    }
}

module.exports.checkEnvVars = checkEnvVars;
module.exports.getEnvVar = getEnvVar;
