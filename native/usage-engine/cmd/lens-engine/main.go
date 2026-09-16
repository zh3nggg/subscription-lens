// Subscription Lens adapter. Upstream engine: see UPSTREAM.md and LICENSE.
// A single request on stdin; metadata-only NDJSON on stdout. No HTTP listener.
package main

import (
 "context"
 "encoding/json"
 "fmt"
 "io"
 "os"
 "path/filepath"
 "time"

 "github.com/zJay26/codex-usage/internal/model"
 "github.com/zJay26/codex-usage/internal/store"
 "github.com/zJay26/codex-usage/internal/usage"
)

type request struct {
 Database string `json:"database"`
 Roots []string `json:"roots"`
 Rebuild bool `json:"rebuild"`
}

func run() error {
 var req request
 dec:=json.NewDecoder(io.LimitReader(os.Stdin, 1024*1024))
 if err:=dec.Decode(&req); err!=nil {return err}
 if !filepath.IsAbs(req.Database) || len(req.Roots)==0 {return fmt.Errorf("absolute database and explicit roots required")}
 for _, root:=range req.Roots {if !filepath.IsAbs(root) {return fmt.Errorf("absolute source path required")}}
 if err:=os.MkdirAll(filepath.Dir(req.Database),0700);err!=nil{return err}
 db,err:=store.Open(req.Database);if err!=nil{return err};defer db.Close()
 ctx,cancel:=context.WithTimeout(context.Background(),5*time.Minute);defer cancel()
 scanner:=usage.Scanner{Store:db}
 result,err:=scanner.Scan(ctx,req.Roots,req.Rebuild);if err!=nil{return err}
 out:=json.NewEncoder(os.Stdout)
 links,err:=db.SessionRelationships(ctx);if err!=nil{return err}
 if err=db.WalkEvents(ctx,model.Filter{},func(e model.UsageEvent)error{
  // Titles can contain user text and are not exported to the desktop ledger.
  e.ThreadTitle=""
  return out.Encode(map[string]any{"type":"event","event":e,"parent":links[e.SessionID].ParentSessionID,"fork":links[e.SessionID].ForkedFromID})
 });err!=nil{return err}
 warnings,err:=db.Warnings(ctx,100);if err!=nil{return err}
 return out.Encode(map[string]any{"type":"complete","scan":result,"warnings":warnings,"machine":db.Machine(),"upstream":"733df6216a0427d43a343a9210539be91b90e5bb"})
}

func main(){if err:=run();err!=nil{json.NewEncoder(os.Stdout).Encode(map[string]string{"type":"error","message":err.Error()});os.Exit(1)}}
