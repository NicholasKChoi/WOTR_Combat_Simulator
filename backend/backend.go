package backend

import (
	"fmt"
	"net/http"
)

func setupRoutes() {
	http.HandleFunc("/simulation", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Run Simulation")
	})
}

func main() {
	fmt.Println("!... Hello World ...!")
	setupRoutes()
	http.ListenAndServe(":8080", nil)
}
