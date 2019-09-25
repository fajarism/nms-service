*  Install module `npm i`
*  Db configuration on sequelize.js (dbname, user, password)
*  Start index.js with node `node index.js`
*  API LIST:
    
    USER
    1.  /api/user/register  Method: PUT
            body:
             {
                 nik: integer,
                 fullname: string,
                 level: integer,
                 password: string
             }

    2.  /api/user/all       Method: GET

    3.  /api/user/:userId   Method: GET
            parameter:
            {
                nik: integer
            }
    4.  /api/user/login     Method: POST
            body:
            {
                nik: integer,
                password: string
            }
    
    HARDWARE
    1.  /api/hardware/add       Method: PUT
            body:
            {
                hardwareId: integer,
                groupId: integer,
                hardwareName: string,
                hardwareAddr: string
            }
    2.  /api/hardware/update    Method: PUT
            body:
            {
                hardwareId: integer,
                groupId: integer,
                whichdata1: whichdata1,
                whichdata2: whichdata2
            }
    3.  /api/hardware/all       Method: GET

    4.  /api/hardware/delete    Method: DELETE
            body:
            {
                hardwareId: integer,
                groupId: integer,
            }    

    GROUP
    1.  /api/group/add       Method: PUT
            body:
            {
                groupId: integer,
                groupName: string
            }
    2.  /api/group/all    Method: GET

    
    STATUS
    1.  /api/status/update       Method: GET
            body:
            {
                groupId: integer
            }
    

# List of return code
| Plugin | README |
| ------ | ------ |
| 200 | Response is handled normally and succesfully by server. May return any user, hardware, transaction, or device group information |
| 400 | General client error. e.g. id is already exist or any form data error |
| 401 | Used in authentication, returned when NIK and password do not match |
| 404 | Used in authentication and any get method to find user, hardware, transaction, or device group information. Returned when the data submitted is not found in database |
| 403 | Used to block reguler user when accessing superuser feature |
| 440 | Session failed, expired, or mismatch |
| xyz | Will be added later |
    