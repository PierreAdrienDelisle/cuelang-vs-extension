package main

import "path"

env:  "environment"
host: "host"

// urlPath is agnostic of environment
urlPath: "/path/to/asset"

// url is derived from host and urlPath
url: "https://" + path.Join([host, urlPath])


#Test: {
    name: string
    testing: string
    tf: {
        aws_resource_test: name: {
            attr: testing
        }
    }
}

test: #Test & {
    name: "MyTest"
    testing: "myattr"
}