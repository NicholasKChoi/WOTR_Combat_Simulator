package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/NicholasKChoi/WOTR_Combat_Simulator/simulation"
)

type ErrorCode string

const (
	ERR_CODE_SIMULATION = ErrorCode("ERR_CODE_SIMULATION")
	ERR_CODE_MARSHAL    = ErrorCode("ERR_CODE_MARSHAL")
)

type Response struct {
	Status string
	Error  struct {
		Msg  string
		Code ErrorCode
	}
	Result simulation.Result
}

func setupRoutes() {
	http.HandleFunc("/simulation", func(w http.ResponseWriter, r *http.Request) {
		var (
			resp    Response
			content []byte
			err     error
		)
		if resp.Result, err = simulation.SimpleRun(); err != nil {
			resp.Error.Msg = err.Error()
			resp.Error.Code = ERR_CODE_SIMULATION
			resp.Status = "error"
		} else {
			resp.Status = "ok"
		}
		if content, err = json.Marshal(resp); err != nil {
			resp.Error.Msg = err.Error()
			resp.Error.Code = ERR_CODE_MARSHAL
		}

		w.Header().Set("Content-Type", "application/json")
		if err != nil {
			w.WriteHeader(500)
		}
		w.Write(content)
	})
}

func main() {
	fmt.Println("!... Hello World ...!")
	setupRoutes()
	http.ListenAndServe(":8080", nil)
}
